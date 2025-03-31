window.addEventListener('DOMContentLoaded', function() {
    // Get our canvas
    var canvas = document.getElementById("renderCanvas");
    var statusMsg = document.getElementById("statusMsg");
    
    // Create Babylon engine
    var engine = new BABYLON.Engine(canvas, true);
    
    // Planet info
    var planetInfo = {
        "Mercury": {
            distance: 13,
            size: 0.4,
            speed: 0.006,
            color: "#A9A9A9",
            info: "Mercury is the smallest and innermost planet in the Solar System. It completes an orbit around the Sun every 88 Earth days."
        },
        "Venus": {
            distance: 14,
            size: 0.9,
            speed: 0.007,
            color: "#FFFACD",
            info: "Venus is the second planet from the Sun. It's often called Earth's sister planet due to similar size and mass. A day on Venus is longer than its year!"
        },
        "Earth": {
            distance: 17,
            size: 1,
            speed: 0.008,
            color: "#6495ED",
            info: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of Earth's surface is water-covered."
        },
        "Mars": {
            distance: 22,
            size: 0.5,
            speed: 0.009,
            color: "#CD5C5C",
            info: "Mars is the fourth planet from the Sun. It's known as the Red Planet due to iron oxide (rust) on its surface. Mars has two small moons."
        },
        "Jupiter": {
            distance: 57,
            size: 11,
            speed: 0.0002,
            color: "#F4A460",
            info: "Jupiter is the largest planet in our Solar System. It's a gas giant with a mass more than two and a half times that of all other planets combined."
        },
        "Saturn": {
            distance: 100,
            size: 9,
            speed: 0.0009,
            color: "#FFD700",
            info: "Saturn is the sixth planet from the Sun and is famous for its prominent ring system, which consists mostly of ice particles with some rocky debris and dust."
        }
    };
    
    // Storage for scene objects
    var scene;
    var camera;
    var sun;
    var planets = {};
    var planetAngles = {}; 
    
    // Create the main scene
    function createScene() {
        // Make a new scene
        scene = new BABYLON.Scene(engine);
        
        // Add a  background
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000.0}, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/skyboxes/space", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skybox.material = skyboxMaterial;
        
        // Add a camera 
        camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 75, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        camera.upperBetaLimit = Math.PI / 1.5;
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 200;
        
        // Add  lighting
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        var sunLight = new BABYLON.PointLight("sunLight", BABYLON.Vector3.Zero(), scene);
        sunLight.intensity = 0.8;
        sunLight.diffuse = new BABYLON.Color3(1, 0.8, 0.6);
        
        // Create all the planets
        createSunAndPlanets();
        
        // Make planets clickable
        makePlanetsClickable();
        
        // Try to set up VR/AR if possible
        setupVRandAR();
        
        return scene;
    }
    
    // Make the sun and all planets
    function createSunAndPlanets() {
        // Create the sun
        sun = BABYLON.MeshBuilder.CreateSphere("sun", {diameter: 20}, scene);
        var sunMaterial = new BABYLON.StandardMaterial("sunMaterial", scene);
        sunMaterial.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
        sun.material = sunMaterial;
        
        // Make the sun glow
        var glowLayer = new BABYLON.GlowLayer("glow", scene);
        glowLayer.intensity = 0.5;
        
        // Create each planet
        for (var name in planetInfo) {
            var info = planetInfo[name];
            
            // Create the planet sphere
            var planet = BABYLON.MeshBuilder.CreateSphere(name, {diameter: info.size * 2}, scene);
            var planetMaterial = new BABYLON.StandardMaterial(name + "Material", scene);
            planetMaterial.diffuseColor = BABYLON.Color3.FromHexString(info.color);
            planet.material = planetMaterial;
            
            // Position the planet
            planet.position.x = info.distance;
            
            // Draw its orbit
            var orbitPoints = [];
            for (var i = 0; i <= 60; i++) {
                var angle = (i * Math.PI * 2) / 60;
                orbitPoints.push(new BABYLON.Vector3(
                    info.distance * Math.cos(angle),
                    0,
                    info.distance * Math.sin(angle)
                ));
            }
            
            var orbit = BABYLON.MeshBuilder.CreateLines("orbit", {points: orbitPoints}, scene);
            orbit.color = new BABYLON.Color3(0.5, 0.5, 0.5);
            orbit.alpha = 0.5;
            
            // Store the planet
            planets[name] = planet;
            planetAngles[name] = Math.random() * Math.PI * 2; // Random starting position
        }
    }
    
    // Make planets show info when clicked
    function makePlanetsClickable() {
        var infoPanel = document.getElementById("infoPanel");
        
        // Make sun clickable
        sun.actionManager = new BABYLON.ActionManager(scene);
        sun.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function() {
                    infoPanel.innerHTML = "<h3>Sun</h3><p>The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated by nuclear fusion reactions in its core.</p>";
                    infoPanel.style.display = "block";
                }
            )
        );
        
        // Make each planet clickable
        for (var name in planets) {
            planets[name].actionManager = new BABYLON.ActionManager(scene);
            planets[name].actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    function(name) {
                        return function() {
                            infoPanel.innerHTML = "<h3>" + name + "</h3><p>" + planetInfo[name].info + "</p>";
                            infoPanel.style.display = "block";
                        };
                    }(name)
                )
            );
        }
        
        // Hide info panel when clicking elsewhere
        scene.onPointerDown = function(evt, pickResult) {
            if (!pickResult.hit) {
                infoPanel.style.display = "none";
            }
        };
    }
    
    // Set up VR and AR
    function setupVRandAR() {
        var vrButton = document.getElementById("vrButton");
        var arButton = document.getElementById("arButton");
        
        // Only try to set up WebXR if we're in a secure context (HTTPS)
        if (!window.isSecureContext) {
            statusMsg.textContent = "WebXR requires HTTPS to work. VR/AR features won't work.";
            return;
        }
        
        // Try to set up WebXR
        try {
            var xrHelper = scene.createDefaultXRExperienceAsync({
                floorMeshes: []
            }).then(function(xrExperience) {
                // Handle VR button
                vrButton.addEventListener("click", function() {
                    xrExperience.baseExperience.enterXRAsync("immersive-vr", "local-floor").catch(function(error) {
                        console.log("Error entering VR: " + error);
                        statusMsg.textContent = "Error entering VR. Your browser might not support it.";
                    });
                });
                
                // Handle AR button
                arButton.addEventListener("click", function() {
                    xrExperience.baseExperience.enterXRAsync("immersive-ar", "unbounded").catch(function(error) {
                        console.log("Error entering AR: " + error);
                        statusMsg.textContent = "Error entering AR. Your browser might not support it.";
                    });
                });
                
                // Setup basic controller support (this is beginner level code)
                xrExperience.input.onControllerAddedObservable.add(function(controller) {
                    console.log("Controller connected!");
                    
                    // Simple controller tracking
                    controller.onMotionControllerInitObservable.add(function(motionController) {
                        var mainTrigger = motionController.getMainComponent();
                        
                        if (mainTrigger) {
                            // When trigger is pressed, check what we're pointing at
                            mainTrigger.onButtonStateChangedObservable.add(function(component) {
                                if (component.pressed) {
                                    // Make a simple raycast from the controller
                                    var ray = new BABYLON.Ray(controller.pointer.position, controller.pointer.forward, 100);
                                    var hit = scene.pickWithRay(ray);
                                    
                                    // If we hit something, show info
                                    if (hit.pickedMesh) {
                                        var meshName = hit.pickedMesh.name;
                                        
                                        // Show info based on what was picked
                                        if (meshName === "sun") {
                                            // Make a simple text popup in VR
                                            makeSimplePopup("Sun", "The Sun is the star at the center of the Solar System.");
                                        } 
                                        else if (planetInfo[meshName]) {
                                            makeSimplePopup(meshName, planetInfo[meshName].info);
                                        }
                                    }
                                }
                            });
                        }
                    });
                });
                
                statusMsg.textContent = "VR/AR ready! Use the buttons below to enter.";
                
            }).catch(function(error) {
                console.log("Error setting up WebXR: " + error);
                statusMsg.textContent = "WebXR not supported by your browser.";
                vrButton.disabled = true;
                arButton.disabled = true;
            });
        } catch (error) {
            console.log("Could not initialize WebXR: " + error);
            statusMsg.textContent = "Error initializing WebXR.";
            vrButton.disabled = true;
            arButton.disabled = true;
        }
    }
    
    // Simple popup text in VR 
    function makeSimplePopup(title, text) {
        // Create a fullscreen UI 
        var ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // Making a simple text panel
        var panel = new BABYLON.GUI.Rectangle();
        panel.width = "400px";
        panel.height = "200px";
        panel.cornerRadius = 20;
        panel.color = "white";
        panel.thickness = 4;
        panel.background = "black";
        ui.addControl(panel);
        
        // Add title
        var titleText = new BABYLON.GUI.TextBlock();
        titleText.text = title;
        titleText.color = "white";
        titleText.fontSize = 24;
        titleText.height = "30px";
        titleText.top = "-70px";
        panel.addControl(titleText);
        
        // Add description
        var bodyText = new BABYLON.GUI.TextBlock();
        bodyText.text = text;
        bodyText.color = "white";
        bodyText.fontSize = 16;
        bodyText.height = "120px";
        bodyText.top = "0px";
        bodyText.textWrapping = true;
        panel.addControl(bodyText);
        
        // Make panel disappear after 5 seconds
        setTimeout(function() {
            ui.dispose();
        }, 5000);
    }
    
    // Animate planets in their orbits
    function movePlanets() {
        for (var name in planets) {
            var planet = planets[name];
            var info = planetInfo[name];
            
            // Update angle
            planetAngles[name] += info.speed;
            
            // Calculate new position
            var x = info.distance * Math.cos(planetAngles[name]);
            var z = info.distance * Math.sin(planetAngles[name]);
            
            // Move the planet
            planet.position.x = x;
            planet.position.z = z;
            
            // Also rotate the planet (simple self-rotation)
            planet.rotation.y += 0.005;
        }
        
        // Rotate the sun 
        sun.rotation.y += 0.001;
    }
    
    // Create the scene
    scene = createScene();
    
    // Run the main render loop
    engine.runRenderLoop(function() {
        movePlanets();
        scene.render();
    });
    
    // Handle window resizing
    window.addEventListener("resize", function() {
        engine.resize();
    });
});