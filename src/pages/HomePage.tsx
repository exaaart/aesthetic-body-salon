import { About } from '../components/About';
import { BookingCta } from '../components/BookingCta';
import { Gallery } from '../components/Gallery';
import { Hero } from '../components/Hero';
import { LaserVideo } from '../components/LaserVideo';
import { Reviews } from '../components/Reviews';
import { Services } from '../components/Services';
import { gallery } from '../data/gallery';

export function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <LaserVideo />
      <About />
      {gallery.length > 0 && <Gallery />}
      <Reviews />
      <BookingCta title={<>Готовы стать ещё красивее?</>} />
    </>
  );
}
