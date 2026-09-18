import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CacheManagerService {
  static const int maxCacheAgeDays = 3;
  static const int maxCacheSizeBytes = 50 * 1024 * 1024; // 50 MB
  static const int targetCacheSizeBytes = 30 * 1024 * 1024; // 30 MB

  /// Run cache cleanup in the background without blocking the UI
  static void initialize() {
    if (kIsWeb) return;
    // Run asynchronously in a background microtask so it never blocks app launch
    Future.microtask(() => cleanCacheInBackground());
  }

  /// Automatically clean cache older than 3 days or files exceeding 50MB
  static Future<void> cleanCacheInBackground() async {
    try {
      debugPrint('[CacheManager] Starting automatic background cache cleanup...');
      final now = DateTime.now();
      final expiryThreshold = now.subtract(const Duration(days: maxCacheAgeDays));

      // 1. Clean SharedPreferences API Cache older than 3 days
      await _cleanExpiredPrefsCache(expiryThreshold);

      // 2. Clean Temporary Directory files
      await _cleanTempDirectory(expiryThreshold);

      // 3. Clean Documents Directory temp exports (.png, .jpg, .pdf, .tmp)
      await _cleanDocsDirectory(expiryThreshold);

      debugPrint('[CacheManager] Background cache cleanup completed successfully.');
    } catch (e) {
      debugPrint('[CacheManager] Error during background cache cleanup: $e');
    }
  }

  /// Cleans SharedPreferences cache keys older than 3 days
  static Future<void> _cleanExpiredPrefsCache(DateTime expiryThreshold) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final cacheKeys = keys.where((k) => k.startsWith('cache_') && !k.startsWith('cache_time_')).toList();

      int deletedCount = 0;
      for (final key in cacheKeys) {
        final timeKey = 'cache_time_${key.replaceFirst('cache_', '')}';
        final timestamp = prefs.getInt(timeKey);

        if (timestamp != null) {
          final cacheDate = DateTime.fromMillisecondsSinceEpoch(timestamp);
          if (cacheDate.isBefore(expiryThreshold)) {
            await prefs.remove(key);
            await prefs.remove(timeKey);
            deletedCount++;
          }
        } else {
          // If no timestamp was recorded (e.g. from prior runs), assign now so it gets cleaned after 3 days
          await prefs.setInt(timeKey, DateTime.now().millisecondsSinceEpoch);
        }
      }
      if (deletedCount > 0) {
        debugPrint('[CacheManager] Cleaned $deletedCount expired API cache entries from SharedPreferences.');
      }
    } catch (e) {
      debugPrint('[CacheManager] Prefs cleanup error: $e');
    }
  }

  /// Cleans Temporary Directory files older than 3 days or if total size > 50MB
  static Future<void> _cleanTempDirectory(DateTime expiryThreshold) async {
    try {
      final tempDir = await getTemporaryDirectory();
      if (!await tempDir.exists()) return;

      final files = await _listAllFiles(tempDir);

      // Step A: Delete files older than 3 days
      List<File> remainingFiles = [];
      int deletedOldCount = 0;

      for (final file in files) {
        try {
          final stat = await file.stat();
          if (stat.modified.isBefore(expiryThreshold)) {
            await file.delete();
            deletedOldCount++;
          } else {
            remainingFiles.add(file);
          }
        } catch (_) {}
      }

      if (deletedOldCount > 0) {
        debugPrint('[CacheManager] Deleted $deletedOldCount temp files older than $maxCacheAgeDays days.');
      }

      // Step B: If total remaining size > 50MB, delete oldest files down to 30MB
      int totalSizeBytes = 0;
      List<MapEntry<File, int>> fileSizes = [];

      for (final file in remainingFiles) {
        try {
          final length = await file.length();
          totalSizeBytes += length;
          fileSizes.add(MapEntry(file, length));
        } catch (_) {}
      }

      if (totalSizeBytes > maxCacheSizeBytes) {
        debugPrint('[CacheManager] Cache size (${(totalSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB) exceeds 50MB. Pruning...');
        
        // Sort files by last modified date ascending (oldest first)
        List<Map<String, dynamic>> sortable = [];
        for (final entry in fileSizes) {
          try {
            final mod = (await entry.key.stat()).modified;
            sortable.add({'file': entry.key, 'size': entry.value, 'modified': mod});
          } catch (_) {}
        }

        sortable.sort((a, b) => (a['modified'] as DateTime).compareTo(b['modified'] as DateTime));

        for (final item in sortable) {
          if (totalSizeBytes <= targetCacheSizeBytes) break;
          try {
            final f = item['file'] as File;
            final s = item['size'] as int;
            await f.delete();
            totalSizeBytes -= s;
          } catch (_) {}
        }
        debugPrint('[CacheManager] Pruned cache down to ${(totalSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB.');
      }
    } catch (e) {
      debugPrint('[CacheManager] Temp dir cleanup error: $e');
    }
  }

  /// Cleans temporary exported PDFs, images and APK files in documents directory
  static Future<void> _cleanDocsDirectory(DateTime expiryThreshold) async {
    try {
      final docsDir = await getApplicationDocumentsDirectory();
      if (!await docsDir.exists()) return;

      final files = await _listAllFiles(docsDir);
      final tempExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.apk', '.tmp'];

      for (final file in files) {
        try {
          final pathLower = file.path.toLowerCase();
          final isTempExport = tempExtensions.any((ext) => pathLower.endsWith(ext));
          if (isTempExport) {
            final stat = await file.stat();
            if (stat.modified.isBefore(expiryThreshold)) {
              await file.delete();
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      debugPrint('[CacheManager] Docs cleanup error: $e');
    }
  }

  /// Recursively lists all files in a directory safely
  static Future<List<File>> _listAllFiles(Directory dir) async {
    final List<File> files = [];
    try {
      final entities = dir.listSync(recursive: true, followLinks: false);
      for (final entity in entities) {
        if (entity is File) {
          files.add(entity);
        }
      }
    } catch (_) {}
    return files;
  }

  /// Calculates total estimated cache size for display in Profile / Settings
  static Future<double> getTotalCacheSizeMB() async {
    if (kIsWeb) return 0.0;
    try {
      int totalBytes = 0;

      // 1. SharedPreferences cache sizes
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith('cache_') && !k.startsWith('cache_time_'));
      for (final key in keys) {
        final val = prefs.get(key);
        if (val is String) {
          totalBytes += val.length;
        }
      }

      // 2. Temp directory files
      final tempDir = await getTemporaryDirectory();
      if (await tempDir.exists()) {
        final files = await _listAllFiles(tempDir);
        for (final f in files) {
          try {
            totalBytes += await f.length();
          } catch (_) {}
        }
      }

      return totalBytes / (1024 * 1024);
    } catch (_) {
      return 0.0;
    }
  }

  /// Manual user-triggered "Clear Cache" button action
  /// Clears cache files while keeping user login tokens and offline sync queue 100% safe!
  static Future<double> clearAllCache() async {
    if (kIsWeb) return 0.0;
    try {
      final initialSizeMB = await getTotalCacheSizeMB();

      // Clear SharedPreferences API cache
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith('cache_')).toList();
      for (final key in keys) {
        await prefs.remove(key);
      }

      // Clear Temp Directory
      final tempDir = await getTemporaryDirectory();
      if (await tempDir.exists()) {
        final files = await _listAllFiles(tempDir);
        for (final f in files) {
          try {
            await f.delete();
          } catch (_) {}
        }
      }

      // Clear exported temp files in Documents
      final docsDir = await getApplicationDocumentsDirectory();
      if (await docsDir.exists()) {
        final files = await _listAllFiles(docsDir);
        final tempExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.apk', '.tmp'];
        for (final f in files) {
          final pathLower = f.path.toLowerCase();
          if (tempExtensions.any((ext) => pathLower.endsWith(ext))) {
            try {
              await f.delete();
            } catch (_) {}
          }
        }
      }

      return initialSizeMB;
    } catch (e) {
      debugPrint('[CacheManager] Error clearing all cache: $e');
      return 0.0;
    }
  }
}
