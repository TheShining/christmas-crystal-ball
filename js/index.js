const OrbitControls = THREE.OrbitControls;
const GLTFLoader = THREE.GLTFLoader;
const RGBELoader = THREE.RGBELoader;
const RoughnessMipmapper = THREE.RoughnessMipmapper;

let camera, scene, renderer, controls, pointLight, composer;

init();
initMusic();

/**
 * 音乐初始化
 */
function initMusic() {
    //创建音频
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const sound = new THREE.Audio(listener);

    // 加载背景音乐
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(
        'music/Mariah Carey-All I Want For Christmas Is You.mp3',
        function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.5);
            sound.autoplay = true;

            const musicButton = document.querySelector('.music-play-button');
            musicButton.addEventListener(
                'click',
                () => {
                    if (sound.isPlaying) {
                        console.log(11111, musicButton, sound, controls);
                        musicButton.firstElementChild.style.animationPlayState = 'paused';
                        controls.autoRotate = false;
                        sound.pause();
                    } else {
                        musicButton.firstElementChild.style.animationPlayState = 'running';
                        controls.autoRotate = true;
                        sound.play();
                    }
                },
                false
            );
            console.log(33333, '开始播放', sound.isPlaying, buffer);
        },
        (audioProgress) => {
            // audio 加载进度条配额 10%
            const audioLoadingProgressQuota = 20;

            // 加载进度
            globalThis.progressCount.musicLoading =
                audioLoadingProgressQuota * (audioProgress.loaded / audioProgress.total);

            if (audioProgress.loaded === audioProgress.total) {
                console.log('audio 加载完毕！！！');
                const heartDom = document.querySelector('.envelope-wrapper .heart');
                heartDom.addEventListener('click', () => {
                    sound.play();
                });
                // Pace.start();
            }
        }
    );
}

/**
 * 模型初始化
 */
function init() {
    const container = document.querySelector('#christmas-ball');

    // const container = document.createElement('div');
    // document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1, 2.5);

    scene = new THREE.Scene();

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.9);
    ambientLight.name = 'ambient_light';
    scene.add(ambientLight);

    // 添加平行光
    const directionalLight = new THREE.DirectionalLight(0x404040, 0.8 * Math.PI);
    directionalLight.position.set(0.5, 0, 0.866); // ~60º
    directionalLight.name = 'main_light';
    scene.add(directionalLight);

    // 添加点光源
    pointLight = new THREE.PointLight(0xfda218, 2, 100);
    pointLight.position.set(20, 20, 20);
    pointLight.castShadow = true;
    pointLight.shadow.bias = -0.001;
    pointLight.shadow.mapSize.width = 2000;
    pointLight.shadow.mapSize.height = 2000;
    scene.add(pointLight);

    new RGBELoader().setPath('models/background/').load(
        'moonless_golf_1k.hdr',
        function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            // use of RoughnessMipmapper is optional
            const roughnessMipmapper = new RoughnessMipmapper(renderer);

            // let isGltfStartLoad = true;
            const loader = new GLTFLoader().setPath('models/');
            loader.load(
                'scene.gltf',
                function (gltf) {
                    gltf.scene.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material.map) {
                                child.material.map.anisotropy = 100;
                            }

                            roughnessMipmapper.generateMipmaps(child.material);
                        }
                    });

                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3()).length();
                    console.log('物体中心点', center, size);

                    gltf.scene.scale.set(0.007, 0.007, 0.007);
                    gltf.scene.position.y = -0.6;

                    scene.add(gltf.scene);

                    roughnessMipmapper.dispose();

                    animate();
                },
                (gltfProgress) => {
                    if (gltfProgress.loaded === gltfProgress.total) {
                        console.log('gltf加载完毕！！！');

                        // 接下来模拟 模型bin文件 和贴图png 文件加载
                        const timer = setInterval(() => {
                            globalThis.progressCount.gltfLoading++;
                            if (globalThis.progressCount.gltfLoading >= 60) {
                                clearInterval(timer);
                            }
                        }, globalThis.webPageLoadingStandard * 1.2); // 预留20%突发情况
                    }
                },
                function (error) {
                    console.error(error);
                }
            );
        },
        (rgbProgress) => {
            // rgb 加载进度条配额 10%
            const rgbLoadingProgressQuota = 10;

            // 加载进度
            globalThis.progressCount.rgbLoading = rgbLoadingProgressQuota * (rgbProgress.loaded / rgbProgress.total);

            if (rgbProgress.loaded === rgbProgress.total) {
                console.log('rgb加载完毕！！！');
            }
        }
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2;
    renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = -10;
    controls.screenSpacePanning = true;

    window.addEventListener('resize', onWindowResize);

    composer = new POSTPROCESSING.EffectComposer(renderer);
    composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
    const effectPass = new POSTPROCESSING.EffectPass(
        camera,
        new POSTPROCESSING.BloomEffect({
            intensity: 3,
            luminanceThreshold: 0.8,
            width: 100,
            height: 100,
        })
    );
    composer.addPass(effectPass);
}

/**
 * 根据窗口大小重设置渲染器尺寸
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    // camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 使模型动起来
 */
function animate() {
    requestAnimationFrame(animate);
    pointLight.position.set(camera.position.x + 5, camera.position.y + 5, camera.position.z - 5);
    controls.update();
    // renderer.render(scene, camera);
    composer.render();
}
