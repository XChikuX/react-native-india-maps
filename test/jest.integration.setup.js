/**
 * Setup for integration tests.
 *
 * Unlike `jest.setup.js`, this file does NOT stub `global.fetch`: the local
 * server suite performs real HTTP requests against an in-process server, and
 * the live suites perform real network requests. The MapLibre mock is kept so
 * that any future import of the component layer resolves without native code.
 */
/* global jest */
jest.mock(
  '@maplibre/maplibre-react-native',
  () => {
    const React = require('react');
    const Mock = (name) => {
      const Component = ({ children, ...props }, ref) =>
        React.createElement(name, { ...props, ref }, children);
      Component.displayName = name;
      return React.forwardRef(Component);
    };

    return {
      __esModule: true,
      default: {
        Map: Mock('Map'),
        Camera: Mock('Camera'),
        Marker: Mock('Marker'),
        GeoJSONSource: Mock('GeoJSONSource'),
        Layer: Mock('Layer'),
        Callout: Mock('Callout'),
        UserLocation: Mock('UserLocation'),
        NativeUserLocation: Mock('NativeUserLocation'),
      },
      Map: Mock('Map'),
      Camera: Mock('Camera'),
      Marker: Mock('Marker'),
      GeoJSONSource: Mock('GeoJSONSource'),
      Layer: Mock('Layer'),
      Callout: Mock('Callout'),
      UserLocation: Mock('UserLocation'),
      NativeUserLocation: Mock('NativeUserLocation'),
    };
  },
  { virtual: true }
);
