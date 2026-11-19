import React from 'react';

/*
  This component should never be rerendered — it’s updated by the game loop.
  The reason this component exists in React is so that the interface can
  co-exist without having to use absolute positioning.
 */

function Camera() {
  return (
    <>
      <canvas id="camera" width="1280" height="800" />
      <canvas
        id="camera-port"
        width="1280"
        height="800"
        className="absolute top-0 left-0"
        hidden
      />
    </>
  );
}

export default React.memo(Camera, () => true);
