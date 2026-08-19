import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
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

    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _notificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onSelectNotification,
    );
  }

  void _onSelectNotification(NotificationResponse response) {
    if (response.payload != null && navigatorKey != null) {
      // Deep Linking Routing Logic based on payload string
      final route = response.payload!;
      final context = navigatorKey!.currentContext;
      if (context != null) {
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
    }
  }

  Future<void> showTestNotification(String title, String body, String payloadRoute) async {
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
      title,
      body,
      platformDetails,
      payload: payloadRoute,
    );
  }
}
