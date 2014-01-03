define(['threejs', 'Leap', 'use!TrackballControls'], function() {
	var ThreeController = function(container, options) {
		options = options || {};
		var self = this;
		var callback = options.callbacks.onRender;

		// Scene
		var scene = new THREE.Scene();
		// ------

		// Camera
		var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000);
		camera.position.set(0, 250, 300);
		// ------
		// Renderer
		var renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMapEnabled = true;
		container.appendChild(renderer.domElement);
		// ------
		// Controls
		var controls = new THREE.TrackballControls(camera, renderer.domElement);
		controls.target.set(0, 100, 0);
		// ------
		// Canvas
		var canvas = container.getElementsByTagName('canvas')[0];
		var width = canvas.width;
		var height = canvas.height;
		// ------
		var light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set( - 1, - 1, - 1).normalize();

		light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(0, 500, 0);
		light.castShadow = true;
		light.shadowMapWidth = 2048;
		light.shadowMapHeight = 2048;
		var d = 200;
		light.shadowCameraLeft = - d;
		light.shadowCameraRight = d;
		light.shadowCameraTop = d * 2;
		light.shadowCameraBottom = - d * 2;

		light.shadowCameraNear = 100;
		light.shadowCameraFar = 600;
		light.shadowCameraVisible = true;

		// Geometry
		var material, geometry, mesh;

		// Ground plane
		material = new THREE.MeshBasicMaterial({
			color: 0x222222
		});
		geometry = new THREE.CubeGeometry(600, 10, 300);
		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, - 10, 0);
        //mesh.castShadow = true;
        //mesh.receiveShadow = true;
		scene.add(mesh);

		// Palm		
		geometry = new THREE.CubeGeometry(100, 20, 80);
		material = new THREE.MeshNormalMaterial({
            wireframe: true
        });
        //material.opacity = 0.5;
		var palm = new THREE.Mesh(geometry, material);
		palm.castShadow = true;
		palm.receiveShadow = true;
		scene.add(palm);

		// Fingers		
		var fingers = [];
		geometry = new THREE.CubeGeometry(16, 12, 1);
		for (var i = 0; i < 5; i++) {
			mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			fingers.push(mesh);
		}

        // Gestures
        var gesture = '', lastGesture = '';

		Leap.loop(function(frame) {
			var hand, direction, len;
			if (frame.hands.length > 0) {
				hand = frame.hands[0];
				palm.position.set(hand.stabilizedPalmPosition[0], hand.stabilizedPalmPosition[1], hand.stabilizedPalmPosition[2]);
				direction = v(hand.direction[0], hand.direction[1], hand.direction[2]); // best so far
				palm.lookAt(direction.add(palm.position));
				palm.rotation.z = - hand.roll();
                palm.rotation.set( hand.pitch(), -hand.yaw(), hand.roll() );
				palm.visible = true;
			} else {
				palm.visible = false;
                gesture = '';
			}

			len = frame.pointables.length;
            var i;
			if (len > 0) {
				var pointable;
				palm.hasFingers = true;
				for (i = 0; i < 5; i++) {
					finger = fingers[i];
					if (i < len) {
						pointable = frame.pointables[i];
						finger.position.set(pointable.stabilizedTipPosition[0], pointable.stabilizedTipPosition[1], pointable.stabilizedTipPosition[2]);
						direction = v(pointable.direction[0], pointable.direction[1], pointable.direction[2]);
						finger.lookAt(direction.add(finger.position));
						finger.scale.z = pointable.length;
						finger.visible = true;
					} else {
						finger.visible = false;
					}
				}

                if (len === 1) {
                } else if (len === 2 || len === 3) {
                    gesture = 'SCISSORS';
                } else if (len === 4 || len === 5) {
                    gesture = 'PAPER';
                }
			} else if (palm.hasFingers) {
				for (i = 0; i < 5; i++) {
					fingers[i].visible = false;
				}
				palm.hasFingers = false;

                gesture = 'ROCK';
			}

            if (gesture != lastGesture) {
                lastGesture = gesture;
                if (options.callbacks.onGesture) {
                    options.callbacks.onGesture(gesture);
                }
            }

            if (options.callbacks.onRender) {
                options.callbacks.onRender();
            }
		});

		var animate = function() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};

		var v = function(x, y, z) {
			return new THREE.Vector3(x, y, z);
		};

        animate();
	};

	return ThreeController;
});

