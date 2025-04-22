/**
 * Navigation utility functions for consistent page navigation
 */

// Navigate to a page using the setCurrentPage function
export const navigateTo = (setCurrentPage, page, params = {}) => {
  if (typeof setCurrentPage !== 'function') {
    console.error('navigateTo: setCurrentPage is not a function');
    return;
  }

  console.log(`Navigating to: ${page}`, params);

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
    if (typeof signOutFn === 'function') {
      await signOutFn();
    }

    // Add a small delay to ensure state updates are processed
    setTimeout(() => {
      // Force a complete page refresh to clear all state
      hardRefresh();
    }, 100);
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if there's an error, still redirect to home
    hardRefresh();
  }
};
