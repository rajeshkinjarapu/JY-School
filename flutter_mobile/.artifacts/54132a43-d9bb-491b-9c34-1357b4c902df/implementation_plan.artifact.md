# Implementation Plan - Remove Total Teachers Header

The user wants to remove the "Total Teachers" count header in the Teachers Directory screen to save space.

## Proposed Changes

### Teachers Screen

#### [MODIFY] [teachers_screen.dart](file:///C:/Users/Admin/Desktop/JY%20School/JY%20ERP/JY-School/flutter_mobile/lib/screens/teachers_screen.dart)
- Remove the `Container` widget that displays "Total Teachers" and the count.
- Remove the `Transform.translate` widget that was used to overlap the search bar onto the header.
- Adjust the padding of the search bar container to look good without the header.

## Verification Plan

### Manual Verification
- Verify that the "Total Teachers" header is gone.
- Verify that the search bar is now positioned correctly below the AppBar.
- Verify that the list of teachers still scrolls correctly and looks good.
