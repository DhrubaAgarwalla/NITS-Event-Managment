# Google Sheets Export Guide

This guide explains how to use the Google Sheets export functionality in the NIT Silchar Event Management System.

## Overview

The system allows you to export event registration data to Google Sheets, which provides several advantages:

1. **Easy Editing**: Club administrators can easily edit and manage registration data
2. **Collaborative**: Multiple club members can work on the same sheet simultaneously
3. **Mobile-Friendly**: Google Sheets works well on mobile devices
4. **Formatting**: The exported sheets include professional formatting and styling

## How It Works

The Google Sheets export functionality works in two ways:

1. **Server-Side Export (Primary Method)**:
   - Uses a Vercel serverless function to create and format Google Sheets
   - Doesn't require user authentication
   - Creates a publicly editable spreadsheet that anyone with the link can access

2. **Client-Side Fallback (Backup Method)**:
   - Used only if the server-side method fails
   - Requires the user to be signed in with a Google account
   - May prompt for Google authentication

## Using the Export Feature

### For Club Administrators

1. Go to your club dashboard
2. Navigate to the event you want to export registrations for
3. Click on the "Export" button
4. Select "Google Sheets" as the export format
5. Wait for the export to complete (this may take a few seconds)
6. Click on the link to open the Google Sheet

### For Event Organizers

1. Go to the event dashboard
2. Click on the "Registrations" tab
3. Click on the "Export" button
4. Select "Google Sheets" as the export format
5. Wait for the export to complete
6. Click on the link to open the Google Sheet

## Features of the Exported Google Sheet

The exported Google Sheet includes:

1. **Event Information**: Title, date, and generation timestamp
2. **Registration Statistics**: Total, individual, and team registrations
3. **Formatted Data**: Clean, organized data with proper formatting
4. **Multiple Sheets**: Separate sheets for registrations and team members (if applicable)
5. **Styling**: Professional styling with alternating row colors and proper headers
6. **Notes Column**: A dedicated column for adding notes or comments
7. **Permissions**: Anyone with the link can edit the sheet

## Troubleshooting

If you encounter issues with the Google Sheets export:

1. **Export Takes Too Long**: The export process may take a few seconds. A loading indicator will be shown during this time.

2. **Export Fails**: If the Google Sheets export fails, the system will automatically fall back to PDF export, which is more reliable but less editable.

3. **Authentication Issues**: If you're prompted for Google authentication, sign in with your Google account to continue.

4. **Permission Issues**: If you can't edit the sheet, make sure you're signed in to your Google account.

## Best Practices

1. **Share Responsibly**: The exported sheets are editable by anyone with the link. Share the link only with authorized club members.

2. **Regular Exports**: Export data regularly to keep backup copies.

3. **Use Notes Column**: Use the provided notes column to add comments or track attendance.

4. **Team Members Sheet**: For team events, check the "Team Members" sheet for detailed information about each team member.

## Technical Details

The Google Sheets export uses the Google Sheets API to create and format spreadsheets. The system uses a service account to authenticate with Google's APIs, which allows it to create spreadsheets on behalf of users without requiring them to authenticate.

The exported sheets are stored in Google Drive and are accessible to anyone with the link. The sheets are not associated with any specific Google account, so they won't appear in your Google Drive unless you explicitly save them.

For any technical issues or questions, please contact the system administrator.
