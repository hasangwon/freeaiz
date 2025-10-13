import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const images = [
  "/images/slide/ex1.webp",
  "/images/slide/ex2.webp",
  "/images/slide/ex3.webp",
  "/images/slide/ex4.webp",
];

const SideSwiper = () => {
  return (
    <Swiper
      modules={[Pagination, Autoplay]}
      spaceBetween={10}
      slidesPerView={2} // 한 번에 2개 보이기
      slidesPerGroup={1} // 한 번에 1개씩 이동
      pagination={{ clickable: true }}
      autoplay={{ delay: 2000, disableOnInteraction: false }}
      loop
    >
      {images.map((src, idx) => (
        <SwiperSlide key={idx}>
          <img
            src={src}
            alt={`Slide ${idx}`}
            className="w-full h-[20rem] object-cover object-center rounded  "
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SideSwiper;
