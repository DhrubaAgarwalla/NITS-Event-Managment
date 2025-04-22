import { useEffect, useState, useRef } from 'react';

const Cursor = () => {
  const cursorRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    
    if (!cursor) return;
    
    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      cursor.style.left = `${clientX}px`;
      cursor.style.top = `${clientY}px`;
    };
    
    const onMouseDown = () => setIsActive(true);
    const onMouseUp = () => setIsActive(false);
    
    const onMouseEnterLink = () => setIsActive(true);
    const onMouseLeaveLink = () => setIsActive(false);
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    
    // Add event listeners to all links and buttons
    const links = document.querySelectorAll('a, button');
    links.forEach(link => {
      link.addEventListener('mouseenter', onMouseEnterLink);
      link.addEventListener('mouseleave', onMouseLeaveLink);
    });
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      
      links.forEach(link => {
        link.removeEventListener('mouseenter', onMouseEnterLink);
        link.removeEventListener('mouseleave', onMouseLeaveLink);
      });
    };
  }, []);

  return (
    <div 
      ref={cursorRef} 
      className={`cursor ${isActive ? 'active' : ''}`}
      style={{ opacity: 0 }} // Start with opacity 0, will be visible on mousemove
    ></div>
  );
};

export default Cursor;
