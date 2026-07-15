/* ============================================================
   Combustion Analyzer — Login brand panel
   Interactive three.js industrial refinery scene.

   - Loaded as a plain <script> (not type="module"), so three.js
     (which only ships ES modules from r150+) is pulled in via a
     dynamic import() from a pinned CDN version.
   - The canvas stays invisible (opacity 0) until the first frame
     has actually rendered at the correct size, then fades in. If
     three.js/WebGL never becomes available, the canvas just stays
     invisible forever and the flat CSS/SVG skyline underneath
     (already shipped, already looks good) is all anyone sees.
   - Skipped entirely on small phones, where the brand panel is
     hidden by CSS anyway.
   ============================================================ */
(function () {
  var canvas = document.getElementById('cx-three-canvas');
  var stage = document.querySelector('.cx-brand-bg');
  if (!canvas || !stage) return;
  if (window.innerWidth <= 560) return; // panel is hidden on small phones
  if (!window.WebGLRenderingContext) return;

  var THREE_CDN = 'https://unpkg.com/three@0.160.0/build/three.module.min.js';

  import(/* webpackIgnore: true */ THREE_CDN)
    .then(function (THREE) {
      initScene(THREE);
    })
    .catch(function (err) {
      console.warn('Combustion Analyzer: 3D scene unavailable, falling back to CSS background.', err);
    });

  function initScene(THREE) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1636, 0.038);

    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    var BASE_CAM_Z = 8.6;
    camera.position.set(0, 2.5, BASE_CAM_Z);
    camera.lookAt(0, 2.15, 0);

    // ---------- lights ----------
    // Hemisphere light gives a natural sky-to-ground gradient of tone,
    // which is what actually separates dark structures from a dark
    // background — much more legible than ambient light alone.
    var hemi = new THREE.HemisphereLight(0x6f9bff, 0x040a1c, 1.35);
    scene.add(hemi);

    scene.add(new THREE.AmbientLight(0x25397a, 0.65));

    var moon = new THREE.DirectionalLight(0xaecaff, 0.85);
    moon.position.set(-8, 12, 6);
    scene.add(moon);

    var rim = new THREE.DirectionalLight(0x4f8dff, 0.55);
    rim.position.set(7, 3, -5);
    scene.add(rim);

    // ---------- ground ----------
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x081327, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ---------- materials (brighter than the background so silhouettes read) ----------
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c3572, roughness: 0.5, metalness: 0.45 });
    var bodyMatLight = new THREE.MeshStandardMaterial({ color: 0x24428f, roughness: 0.45, metalness: 0.5 });
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x1e3f8a, roughness: 0.4, metalness: 0.55 });
    var ringMat = new THREE.MeshStandardMaterial({ color: 0x4f7fe0, roughness: 0.3, metalness: 0.6 });

    var rig = new THREE.Group();
    scene.add(rig);

    // ---------- glow sprite helper (cheap bloom substitute) ----------
    function makeGlowTexture() {
      var c = document.createElement('canvas');
      c.width = c.height = 128;
      var ctx = c.getContext('2d');
      var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(160,200,255,0.6)');
      g.addColorStop(1, 'rgba(160,200,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    var glowTex = makeGlowTexture();
    function addGlow(x, y, z, size, color) {
      var mat = new THREE.SpriteMaterial({ map: glowTex, color: color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      var sprite = new THREE.Sprite(mat);
      sprite.position.set(x, y, z);
      sprite.scale.set(size, size, 1);
      rig.add(sprite);
      return sprite;
    }

    // ---------- structures ----------
    function addTower(x, z, radius, height, ringCount) {
      var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius, height, 12), bodyMat);
      mesh.position.set(x, height / 2, z);
      rig.add(mesh);
      var rc = ringCount || 3;
      for (var i = 1; i <= rc; i++) {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.02, 0.03, 6, 16), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, (height / (rc + 1)) * i, z);
        rig.add(ring);
      }
      var cap = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.9, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), bodyMatLight);
      cap.position.set(x, height, z);
      rig.add(cap);
      return { x: x, y: height, z: z, height: height };
    }

    function addTank(x, z, radius, height) {
      var body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), bodyMatLight);
      body.position.set(x, height / 2, z);
      rig.add(body);
      var dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), bodyMatLight);
      dome.position.set(x, height, z);
      rig.add(dome);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.01, 0.025, 6, 20), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, height * 0.6, z);
      rig.add(ring);
    }

    function addPipe(x1, z1, x2, z2, y, r) {
      var dx = x2 - x1, dz = z2 - z1;
      var len = Math.sqrt(dx * dx + dz * dz);
      var mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), pipeMat);
      mesh.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = -Math.atan2(dz, dx);
      rig.add(mesh);

      [0.15, 0.85].forEach(function (t) {
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, y, 5), pipeMat);
        leg.position.set(x1 + dx * t, y / 2, z1 + dz * t);
        rig.add(leg);
      });
    }

    // Layout kept close to the camera and roughly centered, so the
    // whole complex sits comfortably in frame instead of receding
    // into fog off to one side.
    var t1 = addTower(-3.6, -0.6, 0.34, 3.9, 3);
    var t2 = addTower(-2.3, 0.3, 0.22, 2.7, 2);
    addTank(-0.7, 0.8, 0.72, 1.5);
    addTank(0.7, 1.1, 0.48, 1.05);
    var t3 = addTower(2.2, -0.4, 0.3, 4.5, 4);
    var t4 = addTower(3.5, 0.4, 0.2, 2.9, 2);

    addPipe(-3.6, -0.6, -2.3, 0.3, 0.5, 0.05);
    addPipe(-2.3, 0.3, -0.7, 0.8, 0.5, 0.05);
    addPipe(-0.7, 0.8, 0.7, 1.1, 0.5, 0.05);
    addPipe(0.7, 1.1, 2.2, -0.4, 0.5, 0.05);
    addPipe(2.2, -0.4, 3.5, 0.4, 0.5, 0.05);

    // ---------- blinking window / warning lights ----------
    var blinkLights = [];
    function addBlinkLight(x, y, z) {
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0x9fc4ff }));
      mesh.position.set(x, y, z);
      rig.add(mesh);
      blinkLights.push(mesh);
    }
    addBlinkLight(-3.6, t1.height + 0.3, -0.6);
    addBlinkLight(2.2, t3.height + 0.3, -0.4);
    addBlinkLight(-2.3, t2.height + 0.25, 0.3);
    addBlinkLight(3.5, t4.height + 0.25, 0.4);
    addBlinkLight(-0.7, 1.7, 0.8);
    addBlinkLight(0.7, 1.3, 1.1);

    // ---------- flare stack with flickering flame ----------
    var flareX = -5, flareZ = -1, flareTop = 5;
    var flarePole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, flareTop, 8), bodyMat);
    flarePole.position.set(flareX, flareTop / 2, flareZ);
    rig.add(flarePole);

    var flareLight = new THREE.PointLight(0xffa447, 2.4, 8, 2);
    flareLight.position.set(flareX, flareTop + 0.2, flareZ);
    rig.add(flareLight);

    var flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.6, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb066, transparent: true, opacity: 0.92 })
    );
    flame.position.set(flareX, flareTop + 0.3, flareZ);
    rig.add(flame);

    addGlow(flareX, flareTop + 0.3, flareZ, 2.4, 0xffb066);

    // ---------- rising smoke ----------
    function createSmoke(x, z, baseY, count) {
      var positions = new Float32Array(count * 3);
      var speeds = new Float32Array(count);
      for (var i = 0; i < count; i++) {
        positions[i * 3] = x + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = baseY + Math.random() * 2.6;
        positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
        speeds[i] = 0.26 + Math.random() * 0.32;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var mat = new THREE.PointsMaterial({ color: 0x6f8fc9, size: 0.3, transparent: true, opacity: 0.4, depthWrite: false });
      var pts = new THREE.Points(geo, mat);
      rig.add(pts);
      return { pts: pts, speeds: speeds, baseY: baseY, count: count };
    }
    var smokeA = createSmoke(-3.6, -0.6, t1.height + 0.4, 45);
    var smokeB = createSmoke(2.2, -0.4, t3.height + 0.4, 45);

    // ---------- roaming interactive light (follows the cursor) ----------
    var mouseLight = new THREE.PointLight(0x6fa2ff, 0, 8, 2);
    mouseLight.position.set(0, 2.6, 2.5);
    scene.add(mouseLight);
    var mouseGlow = addGlow(0, 2.6, 2.5, 1.6, 0x6fa2ff);
    mouseGlow.material.opacity = 0;

    // ---------- sizing (robust: retries until the panel has real
    // dimensions, then keeps in sync via ResizeObserver) ----------
    var sized = false;
    function applySize(w, h) {
      if (!w || !h) return false;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      sized = true;
      return true;
    }
    applySize(stage.clientWidth, stage.clientHeight);

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function (entries) {
        var box = entries[0].contentRect;
        applySize(box.width, box.height);
      });
      ro.observe(stage);
    } else {
      window.addEventListener('resize', function () {
        applySize(stage.clientWidth, stage.clientHeight);
      });
    }

    // ---------- mouse interactivity ----------
    var targetRotY = 0, targetRotX = 0, targetDolly = 0;
    var hovering = false;

    function onPointerMove(e) {
      var rect = stage.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width * 2 - 1;
      var ny = (e.clientY - rect.top) / rect.height * 2 - 1;
      targetRotY = nx * 0.3;
      targetRotX = ny * 0.08;
      targetDolly = 0.7;
      hovering = true;

      mouseLight.position.set(nx * 5, 2.4 - ny * 1, 2.8);
      mouseGlow.position.copy(mouseLight.position);
    }
    function onPointerLeave() {
      hovering = false;
      targetRotY = 0;
      targetRotX = 0;
      targetDolly = 0;
    }
    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // ---------- visibility pause ----------
    var paused = false;
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
    });

    // ---------- animate ----------
    var clock = new THREE.Clock();
    var raf;
    var revealed = false;
    function animate() {
      raf = requestAnimationFrame(animate);
      if (paused) return;
      if (!sized) return; // don't render (or reveal) until size is correct

      var t = clock.getElapsedTime();
      var dt = Math.min(clock.getDelta(), 0.05);

      var idleY = Math.sin(t * 0.13) * 0.05;
      rig.rotation.y += ((hovering ? targetRotY : idleY) - rig.rotation.y) * 0.045;
      rig.rotation.x += ((hovering ? targetRotX : 0) - rig.rotation.x) * 0.045;
      camera.position.z += ((BASE_CAM_Z - targetDolly) - camera.position.z) * 0.04;

      var flicker = 0.85 + Math.random() * 0.3;
      flame.scale.set(flicker, 0.8 + Math.random() * 0.5, flicker);
      flareLight.intensity = 2.1 + Math.random() * 0.9;

      blinkLights.forEach(function (m, i) {
        var on = Math.sin(t * 2 + i * 1.7) > 0.15;
        m.material.color.setHex(on ? 0xbfdcff : 0x2c4a8f);
      });

      [smokeA, smokeB].forEach(function (s) {
        var pos = s.pts.geometry.attributes.position;
        for (var i = 0; i < s.count; i++) {
          var y = pos.getY(i) + s.speeds[i] * dt;
          if (y > s.baseY + 2.9) y = s.baseY;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      });

      mouseLight.intensity += ((hovering ? 1.7 : 0) - mouseLight.intensity) * 0.08;
      mouseGlow.material.opacity += ((hovering ? 0.6 : 0) - mouseGlow.material.opacity) * 0.08;

      renderer.render(scene, camera);

      if (!revealed) {
        revealed = true;
        canvas.classList.add('is-ready');
      }
    }
    animate();

    // stop cleanly if this legacy page is ever torn down
    window.addEventListener('beforeunload', function () {
      cancelAnimationFrame(raf);
      renderer.dispose();
    });
  }
})();