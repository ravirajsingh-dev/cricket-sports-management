import React from "react";
import SliderComponent from "./components/Slider";
import About from "./components/About";
import CarouselSections from "./components/CarouselSections";
import Teams from "./components/Teams";
import HomeShowcase from "./components/HomeShowcase";
import Gallery from "./components/Gallery";
import Video from "./components/Video";
import News from "./components/News";
import Faq from "./components/Faq";
import Process from "./components/Process";

const Home = () => {
  return (
    <main className="home-page">
      <SliderComponent />
      <About />
      <CarouselSections />
      <Teams />
      <HomeShowcase />
      <Gallery />
      <News />
      <Video />
      <Faq />
      <Process />
    </main>
  );
};

export default Home;
