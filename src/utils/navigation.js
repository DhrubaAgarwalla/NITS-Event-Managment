/**
 * Navigation utility functions for consistent page navigation
 */
import logger from './logger';

// Navigate to a page using the setCurrentPage function
export const navigateTo = (setCurrentPage, page, params = {}) => {
  if (typeof setCurrentPage !== 'function') {
    logger.error('navigateTo: setCurrentPage is not a function');
    return;
  }

  logger.log(`Navigating to: ${page}`, params);

  // Update browser URL for shareable links
  if (page === 'event-details' && params.eventId) {
    // Update URL without page reload
    window.history.pushState({}, '', `/event/${params.eventId}`);
  } else if (page === 'club-details' && params.clubId) {
    window.history.pushState({}, '', `/club/${params.clubId}`);
  } else if (page === 'events-page') {
    window.history.pushState({}, '', '/events');
  } else if (page === 'clubs-page') {
    window.history.pushState({}, '', '/clubs');
  } else if (page === 'about') {
    window.history.pushState({}, '', '/about');
  } else if (page === 'login') {
    window.history.pushState({}, '', '/login');
  } else if (page === 'club-request') {
    window.history.pushState({}, '', '/request');
  } else if (page === 'home') {
    window.history.pushState({}, '', '/');
  }

  setCurrentPage(page);
};

// Navigate to home page
export const navigateToHome = (setCurrentPage) => {
  navigateTo(setCurrentPage, 'home');
};

// Navigate based on user role
export const navigateAfterLogin = (setCurrentPage, user, isAdmin, isClub) => {
  if (isAdmin) {
    navigateTo(setCurrentPage, 'admin-dashboard');
  } else if (isClub) {
    navigateTo(setCurrentPage, 'club-dashboard');
  } else {
    navigateToHome(setCurrentPage);
  }
};

// Hard refresh the page (for logout and other cases where state needs to be completely reset)
export const hardRefresh = () => {
  window.location.href = '/';
};

// Logout and redirect
export const logoutAndRedirect = async (signOutFn) => {
  try {
    logger.log('Logging out and redirecting...');

    if (typeof signOutFn === 'function') {
      await signOutFn();
      logger.log('Sign out function completed');
    }

    // Store a flag in localStorage to indicate intentional logout
    localStorage.setItem('nits-event-logout', 'true');

    // Add a small delay to ensure state updates are processed
    setTimeout(() => {
      logger.log('Performing hard refresh to clear state');
      // Force a complete page refresh to clear all state
      hardRefresh();
    }, 300); // Increased delay to ensure state updates
  } catch (error) {
    logger.error('Error during logout:', error);
    // Even if there's an error, still redirect to home
    hardRefresh();
  }
};
