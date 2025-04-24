import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import CollageBackground from './CollageBackground';

const Hero = ({ setCurrentPage }) => {
  const heroRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    // Create particles
    if (particlesRef.current) {
      const canvas = particlesRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions
      const setCanvasDimensions = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      setCanvasDimensions();
      window.addEventListener('resize', setCanvasDimensions);

      // Particle settings
      const particlesArray = [];
      const numberOfParticles = 100;

      // Create particle class
      class Particle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 5 + 1;
          this.speedX = Math.random() * 1 - 0.5;
          this.speedY = Math.random() * 1 - 0.5;
          this.color = `rgba(${Math.random() * 110 + 100}, ${Math.random() * 50 + 50}, ${Math.random() * 255}, ${Math.random() * 0.5 + 0.3})`;
        }

        update() {
          this.x += this.speedX;
          this.y += this.speedY;

          if (this.size > 0.2) this.size -= 0.01;

          // Boundary check
          if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
          if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Initialize particles
      const init = () => {
        for (let i = 0; i < numberOfParticles; i++) {
          particlesArray.push(new Particle());
        }
      };

      init();

      // Animation loop
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particlesArray.length; i++) {
          particlesArray[i].update();
          particlesArray[i].draw();
        }

        requestAnimationFrame(animate);
      };

      animate();

      // Mouse interaction
      let mouse = {
        x: null,
        y: null,
        radius: 150
      };

      window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
      });

      // Clean up
      return () => {
        window.removeEventListener('resize', setCanvasDimensions);
      };
    }
  }, []);

  // Parallax effect on mouse move
  useEffect(() => {
    if (heroRef.current) {
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 20;
        const yPos = (clientY / window.innerHeight - 0.5) * 20;

        gsap.to('.hero-content', {
          x: xPos,
          y: yPos,
          duration: 1,
          ease: 'power2.out'
        });
      };

      window.addEventListener('mousemove', handleMouseMove);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <section className="hero" ref={heroRef} id="home">
      {/* Add the collage background */}
      <CollageBackground />

      {/* Keep the original canvas as a fallback but hide it */}
      <canvas ref={particlesRef} className="hero-bg" style={{ display: 'none' }}></canvas>

      <div className="container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover & Join <br />
            NIT Silchar Events
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Your gateway to all technical, cultural, and traditional events happening at NIT Silchar.
            Register, participate, and stay updated with all campus activities.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <button
              onClick={() => setCurrentPage('events-page')}
              className="btn btn-primary"
            >
              Explore Events
            </button>
            <button
              onClick={() => setCurrentPage('clubs-page')}
              className="btn"
            >
              Explore Clubs
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
