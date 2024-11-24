import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import backgroundImage from './img/background1.webp';

const About = () => {
    return (
        <>
            <Header />
            <div className="about" style={{ backgroundImage: `url(${backgroundImage})` }}>
                <h1>About</h1>
                <p>This is a simple app to control a musical staircase, developed as part of my Master's Dissertation for Queen's University Belfast</p>
            </div>
            <Footer />
        </>
    );
};

export default About;
