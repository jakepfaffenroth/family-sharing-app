// Logic for lazy loading images

export default {
  mounted: el => {
    // const cacheImg = new Image()
    // cacheImg.src = el.dataset.url;
    function loadImage() {
      const imageElement = Array.from(el.children).find(
        el => el.nodeName === 'IMG'
      );
      if (el) {
        imageElement.addEventListener('load', () => {
          setTimeout(() => imageElement.classList.add('loaded'), 100);
        });
        imageElement.addEventListener('error', () => console.log(new Error()));
        imageElement.src = imageElement.dataset.url;
      }
    }

    function handleIntersect(entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage();
          observer.unobserve(el);
        }
      });
    }

    function createObserver() {
      const options = {
        root: null,
        rootMargin: '200px',
        threshold: 0
      };
      const observer = new IntersectionObserver(handleIntersect, options);
      observer.observe(el);
    }

    if (window['IntersectionObserver']) {
      createObserver();
    } else {
      loadImage();
    }
  }
};
