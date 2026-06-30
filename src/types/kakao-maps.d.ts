declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number, options?: { animate?: boolean }): void;
    getCenter(): LatLng;
    getLevel(): number;
    relayout(): void;
    panTo(latlng: LatLng): void;
    setBounds(
      bounds: LatLngBounds,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number,
    ): void;
  }

  interface MapOptions {
    center: LatLng;
    level: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    getPosition(): LatLng;
  }

  interface MarkerOptions {
    map?: Map;
    position: LatLng;
    image?: MarkerImage;
    zIndex?: number;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: { offset?: Point });
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    setContent(content: string | HTMLElement): void;
    setZIndex(zIndex: number): void;
  }

  interface CustomOverlayOptions {
    map?: Map;
    position: LatLng;
    content: string | HTMLElement;
    yAnchor?: number;
    xAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }

  namespace event {
    function addListener(
      target: Map | Marker,
      type: string,
      handler: (...args: unknown[]) => void,
    ): void;
    function removeListener(
      target: Map | Marker,
      type: string,
      handler: (...args: unknown[]) => void,
    ): void;
    function trigger(target: Map | Marker, type: string, data?: unknown): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: {
    maps: typeof kakao.maps;
  };
}
