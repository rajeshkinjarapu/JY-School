import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';
import '../screens/homework_screen.dart';
import '../screens/announcements_screen.dart';
import '../screens/events_screen.dart';
import '../screens/messages_screen.dart';

/// Cached notification key in SharedPreferences
const String _kCachedNotifications = 'cached_notifications';
const String _kLastShownHeroNotifId = 'last_shown_hero_notif_id';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  GlobalKey<NavigatorState>? navigatorKey;

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  Future<void> initialize(GlobalKey<NavigatorState> key) async {
    navigatorKey = key;

    // ── 1. Local Notifications Setup ──
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const InitializationSettings initSettings =
        InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _notificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onSelectNotification,
    );

    // ── 2. Create HIGH_IMPORTANCE channel (Android) ──
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'jyschool_alerts_v3',
      'JY School Important Alerts',
      description: 'Critical school notifications — attendance, fees, exams.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    final androidImplementation = _notificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    await androidImplementation?.createNotificationChannel(channel);

    // Explicitly request notification permission for Android 13+
    await androidImplementation?.requestNotificationsPermission();

    // ── 3. FCM Setup ──
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      String? token = await messaging.getToken();
      debugPrint('FCM Token: $token');

      // If user is already logged in at startup, sync token to backend
      syncDeviceToken();

      messaging.onTokenRefresh.listen((newToken) {
        debugPrint('FCM Token Refreshed: $newToken');
        syncDeviceToken();
      });

      // Foreground FCM → show local hero banner with optional Big Picture image
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Foreground FCM received: ${message.messageId}');
        final title = message.notification?.title ?? message.data['title'] ?? 'JY School';
        final body = message.notification?.body ?? message.data['body'] ?? message.data['message'] ?? '';
        final route = message.data['route'] ?? message.data['link'];
        final imageUrl = message.notification?.android?.imageUrl ??
            message.notification?.apple?.imageUrl ??
            message.data['imageUrl'] ??
            message.data['image'];

        if (title.isNotEmpty || body.isNotEmpty) {
          _showHeroBanner(title, body, route, imageUrl: imageUrl);
          _cacheNotification(title, body, route, imageUrl: imageUrl);
        }
      });

      // Background app open via notification tap
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        final route = message.data['route'] ?? message.data['link'];
        if (route != null) {
          _navigateToRoute(route);
        }
      });
    } catch (e) {
      debugPrint('FCM Init Error (safe to ignore on web/desktop): $e');
    }

    // ── 4. Connectivity listener ──
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final isOnline = !results.contains(ConnectivityResult.none);
      if (isOnline) {
        _fetchAndCacheServerNotifications();
      }
    });

    // ── 5. On launch: check connectivity ──
    _handleLaunchNotifications();
  }

  // ─────────────────────────────────────────────────────────────
  // SYNC FCM DEVICE TOKEN TO BACKEND
  // ─────────────────────────────────────────────────────────────
  Future<void> syncDeviceToken() async {
    try {
      final token = await ApiService.getToken();
      if (token == null) {
        debugPrint('NotificationService: Skip sync, user not logged in.');
        return;
      }
      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken != null && fcmToken.isNotEmpty) {
        debugPrint('NotificationService: Syncing FCM Token -> $fcmToken');
        await ApiService.saveDeviceToken(fcmToken);
      }
    } catch (e) {
      debugPrint('NotificationService: syncDeviceToken error: $e');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LAUNCH: ONLINE → FETCH & CACHE, OFFLINE → REPLAY CACHE
  // ─────────────────────────────────────────────────────────────
  Future<void> _handleLaunchNotifications() async {
    await Future.delayed(const Duration(seconds: 2));

    final connectivityResults = await Connectivity().checkConnectivity();
    final isOnline = !connectivityResults.contains(ConnectivityResult.none);

    if (isOnline) {
      await _fetchAndCacheServerNotifications();
    } else {
      await _replayCachedNotifications();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FETCH FROM SERVER AND CACHE
  // ─────────────────────────────────────────────────────────────
  Future<void> _fetchAndCacheServerNotifications() async {
    try {
      final res = await ApiService.getNotifications();
      if (res['success'] == true) {
        final dynamic payload = res['data'];
        final List<dynamic> data = (payload is Map && payload.containsKey('notifications'))
            ? (payload['notifications'] ?? [])
            : (payload is List ? payload : []);

        // Take the 5 most recent unread notifications
        final unread = data
            .where((n) => n['isRead'] == false)
            .take(5)
            .map((n) {
              String? rawLink = n['link']?.toString() ?? n['route']?.toString();
              String? route = rawLink;
              String? imgUrl = n['imageUrl']?.toString() ?? n['image']?.toString();

              // Parse "route|imageUrl" if combined
              if (rawLink != null && rawLink.contains('|')) {
                final parts = rawLink.split('|');
                route = parts[0].isNotEmpty ? parts[0] : 'announcements';
                if (parts.length > 1 && parts[1].isNotEmpty) {
                  imgUrl = parts[1];
                }
              }

              return {
                'id': n['id']?.toString() ?? '',
                'title': n['title'] ?? 'JY School',
                'body': n['message'] ?? n['body'] ?? '',
                'route': route ?? 'announcements',
                'imageUrl': imgUrl,
                'createdAt': n['createdAt'] ?? DateTime.now().toIso8601String(),
              };
            })
            .toList();

        await _saveToCache(unread);

        // Smart Hero Banner trigger for newly arrived unread notifications
        if (unread.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();
          final String? lastShownId = prefs.getString(_kLastShownHeroNotifId);
          final newest = unread.first;
          final String newestId = newest['id'] ?? '';

          if (newestId.isNotEmpty && newestId != lastShownId) {
            DateTime? createdAt;
            try {
              if (newest['createdAt'] != null) {
                createdAt = DateTime.parse(newest['createdAt']);
              }
            } catch (_) {}

            final isRecent = createdAt == null || DateTime.now().difference(createdAt).inHours < 24;
            if (isRecent) {
              await _showHeroBanner(
                newest['title'] ?? 'JY School',
                newest['body'] ?? '',
                newest['route'],
                imageUrl: newest['imageUrl'],
              );
            }
            await prefs.setString(_kLastShownHeroNotifId, newestId);
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      await _replayCachedNotifications();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REPLAY CACHED NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  Future<void> _replayCachedNotifications() async {
    final cached = await _loadFromCache();
    if (cached.isEmpty) return;
    debugPrint('Offline/Error: Cached notifications are ready for UI.');
  }

  // ─────────────────────────────────────────────────────────────
  // SHOW HERO BANNER (WITH OPTIONAL BIG PICTURE BANNER)
  // ─────────────────────────────────────────────────────────────
  Future<void> _showHeroBanner(
    String? title,
    String? body,
    String? route, {
    String? imageUrl,
  }) async {
    StyleInformation? styleInformation;

    // Check if image URL exists and download for Big Picture style
    if (imageUrl != null && imageUrl.trim().isNotEmpty) {
      try {
        final formattedUrl = ApiService.getImageUrl(imageUrl.trim());
        if (formattedUrl.isNotEmpty) {
          final http.Response response = await http
              .get(Uri.parse(formattedUrl))
              .timeout(const Duration(seconds: 12));

          if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
            final tempDir = await getTemporaryDirectory();
            final tempFile = File('${tempDir.path}/hero_banner_${DateTime.now().millisecondsSinceEpoch}.jpg');
            await tempFile.writeAsBytes(response.bodyBytes);
            final bigPictureBitmap = FilePathAndroidBitmap(tempFile.path);

            styleInformation = BigPictureStyleInformation(
              bigPictureBitmap,
              hideExpandedLargeIcon: true,
              contentTitle: title ?? 'JY School',
              htmlFormatContentTitle: true,
              summaryText: body ?? '',
              htmlFormatSummaryText: true,
            );
          }
        }
      } catch (e) {
        debugPrint('Error loading notification big picture: $e');
      }
    }

    // Fallback to Rich Big Text Style if no image or download fails
    styleInformation ??= BigTextStyleInformation(body ?? '');

    final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'jyschool_alerts_v3',
      'JY School Important Alerts',
      channelDescription: 'Critical school notifications.',
      importance: Importance.max,
      priority: Priority.high,
      fullScreenIntent: false,
      styleInformation: styleInformation,
      ticker: title,
      icon: '@mipmap/ic_launcher',
      playSound: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title ?? 'JY School',
      body ?? '',
      details,
      payload: route,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CACHE HELPERS (SharedPreferences)
  // ─────────────────────────────────────────────────────────────
  Future<void> _cacheNotification(
    String? title,
    String? body,
    String? route, {
    String? imageUrl,
  }) async {
    final existing = await _loadFromCache();
    existing.insert(0, {
      'title': title ?? 'JY School',
      'body': body ?? '',
      'route': route ?? 'announcements',
      'imageUrl': imageUrl,
      'createdAt': DateTime.now().toIso8601String(),
    });
    final trimmed = existing.take(15).toList();
    await _saveToCache(trimmed);
  }

  Future<void> _saveToCache(List<Map<String, dynamic>> notifications) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kCachedNotifications, jsonEncode(notifications));
  }

  Future<List<Map<String, dynamic>>> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kCachedNotifications);
      if (raw == null) return [];
      final List<dynamic> decoded = jsonDecode(raw);
      return decoded.map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION ON NOTIFICATION TAP
  // ─────────────────────────────────────────────────────────────
  void _onSelectNotification(NotificationResponse response) {
    if (response.payload != null) {
      _navigateToRoute(response.payload!);
    }
  }

  void _navigateToRoute(String route) {
    if (navigatorKey == null || navigatorKey!.currentContext == null) return;
    final context = navigatorKey!.currentContext!;

    // Remove any trailing image payload attached e.g. "announcements|http..."
    final cleanRoute = route.split('|').first.toLowerCase();

    Widget destination;
    switch (cleanRoute) {
      case 'homework':
        destination = const HomeworkScreen();
        break;
      case 'announcements':
        destination = const AnnouncementsScreen();
        break;
      case 'events':
        destination = const EventsScreen();
        break;
      case 'messages':
        destination = const MessagesScreen();
        break;
      default:
        destination = const AnnouncementsScreen();
        break;
    }

    Navigator.of(context).push(MaterialPageRoute(builder: (_) => destination));
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: Manual trigger (for testing)
  // ─────────────────────────────────────────────────────────────
  Future<void> showTestNotification(
    String title,
    String body,
    String payloadRoute, {
    String? imageUrl,
  }) async {
    await _showHeroBanner(title, body, payloadRoute, imageUrl: imageUrl);
    await _cacheNotification(title, body, payloadRoute, imageUrl: imageUrl);
  }

  /// Clear all cached notifications (e.g. on logout)
  Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kCachedNotifications);
    await prefs.remove(_kLastShownHeroNotifId);
  }

  /// Get cached notifications for display in NotificationsScreen (offline)
  Future<List<Map<String, dynamic>>> getCachedNotifications() async {
    return _loadFromCache();
  }
}
