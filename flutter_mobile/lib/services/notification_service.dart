import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import '../screens/homework_screen.dart';
import '../screens/announcements_screen.dart';
import '../screens/events_screen.dart';
import '../screens/messages_screen.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  GlobalKey<NavigatorState>? navigatorKey;

  Future<void> initialize(GlobalKey<NavigatorState> key) async {
    navigatorKey = key;

    // Request permissions
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get the token and save it to the server
    String? token = await messaging.getToken();
    debugPrint('FCM Token: $token');
    if (token != null) {
      // In a real app, send this to backend (e.g. ApiService.saveFCMToken(token))
    }

    // Handle token refresh
    messaging.onTokenRefresh.listen((newToken) {
      debugPrint('FCM Token Refreshed: $newToken');
      // Send new token to server
    });

    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _notificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onSelectNotification,
    );

    // Foreground message handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Got a message whilst in the foreground!');
      if (message.notification != null) {
        _showLocalNotification(message.notification!.title, message.notification!.body, message.data['route']);
      }
    });

    // Background app open handler
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (message.data['route'] != null) {
        _navigateToRoute(message.data['route']);
      }
    });
  }

  void _onSelectNotification(NotificationResponse response) {
    if (response.payload != null) {
      _navigateToRoute(response.payload!);
    }
  }

  void _navigateToRoute(String route) {
    if (navigatorKey == null || navigatorKey!.currentContext == null) return;
    final context = navigatorKey!.currentContext!;
    
    Widget destination;
    switch (route) {
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
        return; // No known route
    }
    
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => destination));
  }

  Future<void> _showLocalNotification(String? title, String? body, String? payloadRoute) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'jy_school_channel',
      'JY School Notifications',
      channelDescription: 'General notifications for the school',
      importance: Importance.max,
      priority: Priority.high,
    );
    const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

    await _notificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title ?? 'Notification',
      body ?? '',
      platformDetails,
      payload: payloadRoute,
    );
  }

  Future<void> showTestNotification(String title, String body, String payloadRoute) async {
    await _showLocalNotification(title, body, payloadRoute);
  }
}
