import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class UpdateService {
  // Add your VPS server or domain where app-version.json is hosted
  static const String updateUrl = 'http://66.116.252.191:19998/app-version.json';

  static Future<void> checkForUpdate(BuildContext context) async {
    try {
      final response = await http.get(Uri.parse(updateUrl));
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final String latestVersion = data['latestVersion'] ?? '1.0.0';
        final String downloadUrl = data['downloadUrl'] ?? '';
        final bool forceUpdate = data['forceUpdate'] ?? false;
        final String releaseNotes = data['releaseNotes'] ?? 'New version available. Please update.';

        PackageInfo packageInfo = await PackageInfo.fromPlatform();
        String currentVersion = packageInfo.version;

        if (_isUpdateAvailable(currentVersion, latestVersion)) {
          if (context.mounted) {
            _showUpdateDialog(context, latestVersion, releaseNotes, downloadUrl, forceUpdate);
          }
        }
      }
    } catch (e) {
      debugPrint("Update check failed: $e");
    }
  }

  static bool _isUpdateAvailable(String currentVersion, String latestVersion) {
    List<String> currentParts = currentVersion.split('.');
    List<String> latestParts = latestVersion.split('.');

    for (int i = 0; i < 3; i++) {
      int current = int.tryParse(currentParts.length > i ? currentParts[i] : '0') ?? 0;
      int latest = int.tryParse(latestParts.length > i ? latestParts[i] : '0') ?? 0;

      if (latest > current) return true;
      if (latest < current) return false;
    }
    return false;
  }

  static void _showUpdateDialog(BuildContext context, String version, String releaseNotes, String downloadUrl, bool forceUpdate) {
    showDialog(
      context: context,
      barrierDismissible: !forceUpdate,
      builder: (BuildContext context) {
        return WillPopScope(
          onWillPop: () async => !forceUpdate,
          child: AlertDialog(
            title: Text('Update Available ($version)'),
            content: SingleChildScrollView(
              child: ListBody(
                children: <Widget>[
                  Text('A new version of the app is available.'),
                  const SizedBox(height: 8),
                  Text(releaseNotes, style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 16),
                  const Text('Clicking "Update" will download the new APK. Please install it after downloading.'),
                ],
              ),
            ),
            actions: <Widget>[
              if (!forceUpdate)
                TextButton(
                  child: const Text('Later'),
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
              ElevatedButton(
                child: const Text('Update Now'),
                onPressed: () async {
                  if (await canLaunchUrl(Uri.parse(downloadUrl))) {
                    await launchUrl(Uri.parse(downloadUrl), mode: LaunchMode.externalApplication);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
