import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';

class UpdateService {
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
          child: _UpdateDialogWidget(
            version: version,
            releaseNotes: releaseNotes,
            downloadUrl: downloadUrl,
            forceUpdate: forceUpdate,
          ),
        );
      },
    );
  }
}

class _UpdateDialogWidget extends StatefulWidget {
  final String version;
  final String releaseNotes;
  final String downloadUrl;
  final bool forceUpdate;

  const _UpdateDialogWidget({
    Key? key,
    required this.version,
    required this.releaseNotes,
    required this.downloadUrl,
    required this.forceUpdate,
  }) : super(key: key);

  @override
  State<_UpdateDialogWidget> createState() => _UpdateDialogWidgetState();
}

class _UpdateDialogWidgetState extends State<_UpdateDialogWidget> {
  bool isDownloading = false;
  double progress = 0.0;
  String status = 'Ready';

  Future<void> _downloadAndInstall() async {
    setState(() {
      isDownloading = true;
      status = 'Downloading...';
      progress = 0.0;
    });

    try {
      Directory? tempDir = await getExternalStorageDirectory();
      String savePath = "${tempDir?.path}/jyschool_update_${widget.version}.apk";

      Dio dio = Dio();
      await dio.download(
        widget.downloadUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              progress = received / total;
              status = 'Downloading... ${(progress * 100).toStringAsFixed(0)}%';
            });
          }
        },
      );

      setState(() {
        status = 'Opening installer...';
      });

      final result = await OpenFile.open(savePath);
      if (result.type != ResultType.done) {
        setState(() {
          status = 'Failed to open installer: ${result.message}';
          isDownloading = false;
        });
      }
    } catch (e) {
      setState(() {
        status = 'Error downloading: $e';
        isDownloading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Update Available (${widget.version})'),
      content: SingleChildScrollView(
        child: ListBody(
          children: <Widget>[
            const Text('A new version of the app is available.'),
            const SizedBox(height: 8),
            Text(widget.releaseNotes, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            if (isDownloading) ...[
              LinearProgressIndicator(value: progress),
              const SizedBox(height: 8),
              Text(status, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ] else ...[
              const Text('Clicking "Update Now" will download and install the new version.'),
            ]
          ],
        ),
      ),
      actions: <Widget>[
        if (!widget.forceUpdate && !isDownloading)
          TextButton(
            child: const Text('Later'),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ElevatedButton(
          onPressed: isDownloading ? null : _downloadAndInstall,
          child: Text(isDownloading ? 'Downloading...' : 'Update Now'),
        ),
      ],
    );
  }
}
