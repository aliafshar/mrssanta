/**
 * Copyright Google
 */





class Game {

  constructor(heroObj) {
    this.createRenderer();
    this.levelNumber = 0;
    this.score = 0;
    this.statusBar = new StatusBar(this);
    this.heroObj = heroObj;
    var hammer = new Hammer(window);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammer.on('panleft', (ev) => {
      this.pressed_right = true;
    });
    hammer.on('panright', (ev) => {
      this.pressed_left = true;
    });
    addEventListener('keydown', (event) => { this.key(event.keyCode) });
    if (screenfull.enabled) {
    screenfull.request();
    }
    this.newGame();
  }

  newGame() {
    this.scale = 50;
    this.zscale = 30;
    this.baseSpeed = 2;
    this.levelNumber++;
    this.level = new Level(this);
    const sc = this.scene = new THREE.Scene();
    const cam = this.camera = new THREE.PerspectiveCamera(75,
        window.innerWidth / window.innerHeight, 1, 500);
    cam.position.set(0, 10, -25);
    sc.add(cam);
    const l = new THREE.PointLight(0xcccc00, 1);
    //sc.add(l);
    this.camera = cam;
    this.light = l;
    const h = new Hero(this);
    this.hero = h
    cam.lookAt(h.mesh.position);
    const g = new Ground(this);
    const c = new Coins(this);
    var light = new THREE.HemisphereLight( 0xaaaaaa, g.mesh.material.color, 1.0 );
    sc.add( light );
    this.scene.fog = new THREE.FogExp2(0x000000, 0.003);
    this.renderer.setClearColor( this.scene.fog.color, 1 );
    this.stars = new Stars(this);
    this.scene.add(this.stars.points);
    this.clock = new THREE.Clock();
    this.clock.start();
    this.frameClock = new THREE.Clock();
    this.frameClock.start();
    this.framecounter = 0;
    this.keyEvents = [];
    this.pressed_right = false;
    this.pressed_left = false;
  }

  createRenderer() {
    const r = new THREE.WebGLRenderer();
    r.setSize(window.innerWidth, innerHeight);
    r.shadowMapEnabled = true;
    document.getElementById('glholder').appendChild(r.domElement);
    this.renderer = r;
  }

  frame() {

    if (this.frameClock.getElapsedTime() > 0.1) {
      this.frameClock.stop();

      this.dispatchCollision();
      this.hero.moveWithEveryone(this.hero.speed);
      if (this.hero.mesh.position.z > 6000) {
        this.clock.stop();
        this.newGame();
        this.run();
        return;
      }
      const p = this.hero.mesh.position;
      const mscale = this.hero.mesh.scale;
      if (mscale.y > 1.1) {
        mscale.y /= 1.001;
      } else {
        mscale.y *= 1.001;
      }
      //this.hero.mesh.rotation.y += 0.01;
      this.frameClock.start();
    }
    TWEEN.update();
    if (this.pressed_right) {
      this.hero.move(this.scale, 0);
      this.pressed_right = false;
    }
    if (this.pressed_left) {
      this.hero.move(-this.scale, 0);
      this.pressed_left = false;
    }

    this.hero.updatePosition();
    //const strong = this.hero.capabilities.caps['strong'];
    this.hero.capabilities.tick();
    const elapsedTime = this.stars.clock.getElapsedTime();
    this.stars.points.material.uniforms.elapsedTime.value = elapsedTime * 10;
    if (this.framecounter++ == 10) {
      this.framecounter = 0;
      this.statusBar.update();
    }
    requestAnimationFrame(() => { this.frame() });
    this.renderer.render(this.scene, this.camera);
    //this.cannonDebugRenderer.update();      // Update the debug renderer
  }

  run() {
    requestAnimationFrame(() => { this.frame() });
  }

  key(keyCode) {
      switch (event.keyCode) {
        case 32:
          this.hero.speed = this.baseSpeed;
        break;

        case 37:
          this.pressed_right = true;
        break;

        case 38:
          this.hero.move(0, 14);
          //this.hero.moveWithEveryone(this.hero.speed);
        break;

        case 39:
          //this.hero.move(-this.scale, 0);
          this.pressed_left = true;
        break;

        case 40:
          this.hero.move(0, -14);
        break;
      }
  }

  dispatchCollision() {
    const p = this.hero.mesh.position;
    const b = this.level.blockAt(p);
    if (b) {
      if (this.level.hasHit(b)) {
        return;
      }
      this.level.hitBlock(b);
      b.collide(p);
    }
  }

}


class StatusBar {
  constructor(game) {
    this.game = game;
    this.points = document.getElementById("status_points");
    this.time = document.getElementById("status_time");
    this.speed = document.getElementById("status_speed");
    this.strong = document.getElementById("status_strong");
    this.level = document.getElementById("status_level");

  }

  update() {
    this.speed.innerHTML = this.game.hero.speed.toFixed(2);
    this.strong.innerHTML = this.game.hero.capabilities.caps['strong'];
    this.level.innerHTML = "Level " + this.game.levelNumber;
    this.points.innerHTML = this.game.score;
    this.time.innerHTML = this.game.clock.getElapsedTime().toFixed(0);

    if (this.game.hero.capabilities.caps['strong'] > 0) {
      this.game.hero.strongMesh.visible = true;
    } else {
      this.game.hero.strongMesh.visible = false;
    }





  }
}


class Hero {

  constructor(game) {
    this.speed = 2;
    this.game = game;
    this.capabilities = new Capabilities();
    this.capabilities.enable("strong", 0);
    this.buildMesh();
    this.mesh.castShadow = true;
    this.light = new THREE.PointLight(0xffffff, 0.5);
    this.light.castShadow = true;
    this.light.target = this.mesh;
    game.scene.add(this.light.target);
    game.scene.add(this.mesh);
    this.game.scene.add(this.light);
  }

  buildMesh() {
    const mt = new THREE.MeshPhongMaterial({transparent: false, color: 'silver', opacity: 0.3, shading: THREE.FlatShading});
    const g = new THREE.IcosahedronGeometry(4, 1);
    this.geometry = g;
    const g2 = new THREE.SphereGeometry(2, 32, 32);
    g2.translate(0, 7, 0);
    const m2 = new THREE.Mesh(g2, mt);
    //g.merge(g2);
    const m = new THREE.Mesh(g, mt);
    this.headMesh = m2;
    m.castShadow = true;
    m2.castShadow = true;
    this.mesh = new THREE.Group();



    const g4 = new THREE.TorusBufferGeometry(10, 0.3, 16, 16, Math.PI * 2);
    g4.rotateX(Math.PI / 2);
    const m4 = new THREE.Mesh(g4, mt);
    this.strongMesh = m4;
    this.strongMesh.visible = false;
    this.strongMesh.castShadow = true;
    this.mesh.add(m4);
    


    const m9 = snowmanModels.children[3].clone();
    m9.castShadow = true;
    m9.scale.x = m9.scale.y = m9.scale.z = 0.05;
    m9.material.map = snowmanTexture;
    //m9.translateX(i * 10 - 10);
    this.mesh.add(m9);
    this.realMesh = m9
      this.mesh.translateY(5);



    //const m5 = models.children[1];
    //this.mesh.add(m5);
  }

  updatePosition() {
    const p = this.mesh.position;
    this.game.camera.position.set(p.x, 22, p.z - 30);
    this.light.position.set(p.x, p.y + 30, p.z);
    this.headMesh.position.set(p.x, this.headMesh.position.y, p.z);
  }

  moveWithEveryone(z) {
    this.mesh.translateZ(z);
  }

  move(xd, yd) {
    if (this.lateralMoving) {
      return;
    }
    if (this.mesh.position.x == -this.game.scale && xd < 0) {
      return;
    }
    if (this.mesh.position.x == this.game.scale && xd > 0) {
      return;
    }
    this.lateralMoving = true;
    const t = new TWEEN.Tween(this.mesh.position)
      .easing(TWEEN.Easing.Quadratic.Out)
      .to({x: this.mesh.position.x + xd,
           y: this.mesh.position.y + yd}, 100);
    t.onComplete(() => {this.lateralMoving = false;});
    t.start();
  }

  jumpUp(step) {
    if (this.verticalMoving) {
      return;
    }
    this.verticalMoving = true;
    const t = new TWEEN.Tween(this.mesh.position)
      .easing(TWEEN.Easing.Quadratic.Out)
      .to({y: this.mesh.position.y + step}, 200);
    t.onComplete(() => {this.verticalMoving = false;});
    t.start();
  }

}


class Ground {

  constructor(game) {
    this.game = game;
    this.buildMesh();
    game.scene.add(this.mesh);
  }

  buildMesh() {
    const g = new THREE.PlaneGeometry(200, 6000, 30, 300);
    const NoiseGen = new SimplexNoise();
    for (var i = 0; i < g.vertices.length; i++) {
			var vertex = g.vertices[i];
			vertex.z = NoiseGen.noise2D( vertex.x / 10, vertex.y / 10 ) * 5;
		}
    g.computeVertexNormals();
    g.computeFaceNormals();
    g.rotateX(Math.PI / -2);
    g.translate(0, -5, 3000);

    //const mt = new THREE.MeshPhongMaterial({map: texture});
    //const mt = new THREE.MeshPhongMaterial({color: 0x006633, shading: THREE.FlatShading});
    const mt = new THREE.MeshPhongMaterial({color: 0xffffff});
    //const mt = new THREE.MeshPhongMaterial({color: 0xffffff, shading: THREE.FlatShading});
    //const mt = new THREE.MeshBasicMaterial({map: texture});
    const m = new THREE.Mesh(g, mt);
    m.receiveShadow = true;
    this.mesh = m;

    for (var j = 0; j < 6000; j+=60) {
      const m9 = treeModels.children[0].clone();
      m9.scale.x = m9.scale.y = m9.scale.z = 0.06;
      m9.material.map = treeTexture;
      m9.translateZ(j);
      m9.translateX(-100); 
      this.game.scene.add(m9);
    
    }
    for (var j = 15; j < 6000; j+=60) {
      const m9 = treeModels.children[0].clone();
      m9.scale.x = m9.scale.y = m9.scale.z = 0.06;
      m9.material.map = treeTexture;
      m9.translateZ(j);
      m9.translateX(60); 
      this.game.scene.add(m9);
    
    }
  }

}


class Level {

  constructor(game) {
    this.game = game;
    this.lanes = 3;
    this.rows = 200;

    this.items = this.buildItems();

    this.iitems = [
      [2, 0, 0],
      [2, 0, 0],
      [2, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [1, 2, 0],
      [1, 2, 0],
      [1, 2, 0],
      [1, 2, 0],
      [1, 2, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [1, 2, 2],
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
      [2, 2, 3],
      [2, 0, 0],
      [2, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [0, 2, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 3, 2],
      [0, 0, 2],
      [2, 2, 2],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0]];




    

    this.blocks = [{}, {}, {}];
    this.visited = [{}, {}, {}];

    this.meshes = {};
    this.seenMeshes = {};
  }


  buildItems() {
    const items = [[2, 0, 0]];
    let i = 0;
    var orow = items[0];
    while (items.length < this.rows - 20) {
      const xpos = orow.indexOf(2);
      let newxpos = xpos;

      if (xpos == 0) {
        if (Math.random() > 0.7) {
          newxpos = 1;
        } else {
          newxpos = 2;
        }
      } else if (xpos == 2) {
        if (Math.random() > 0.7) {
          newxpos = 1;
        } else {
          newxpos = 0;
        }
      } else if (xpos == 1) {
        if (Math.random() > 0.5) {
          newxpos = 0;
        } else {
          newxpos = 2;
        }
      }
      const pad = [0, 0, 0];
      const pad2 = [0, 0, 0];
      pad[newxpos] = 2;
      pad2[newxpos] = 2;
      pad[xpos] = 2;
      pad2[xpos] = 2;
      if (Math.random() > 0.95) {
        pad[newxpos] = 4;
      } else if (Math.random() > 0.9) {
        pad[newxpos] = 5;
      }
      items.push(pad2);
      items.push(pad);
      const row = [0, 0, 0];
      for (var j = 0; j < 3; j++) {
        if (j == newxpos) {
          row[j] = 2;

        } else {
          
          if (Math.random() > 0.3) {
            if (Math.random() > 0.5) {
              row[j] = 1;
            } else {
              row[j] = 3;
            }

          }

        }
      }
      orow = row;
      var n = Math.random() * 4 + 1;
      for (var q = 0; q < n; q++) {
        items.push(row);
      }
    }
    const preend = [0, 2, 0];
    while (items.length < this.rows - 5) {
      items.push(preend);
    }
    while (items.length < this.rows) {
      items.push([3, 2, 3]);
    }
    return items;
  }

  get(row) {
    return this.items[row % this.items.length];
  }

  addBlock(block, x, z) {
    this.blocks[x][z] = block;
  }

  hitBlock(block) {
    //delete this.blocks[block.x][block.z];
    this.visited[block.x][block.z] = true;
  }

  hasHit(block) {
    return this.visited[block.x][block.z];
  }


  blockAt(p) {
    const z = Math.floor((p.z + 10) / this.game.zscale);
    const x = Math.floor(p.x / this.game.scale) + 1;
    const b = this.blocks[x][z];
    return b
  }

}


const texture = THREE.ImageUtils.loadTexture( '../models/snow_gloss.jpg' );


class Rainbow {

  constructor() {
    this.i = 0;
    this.colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
  }

  next() {
    return this.colors[this.i++ % this.colors.length];
  }

}

const RAINBOW = new Rainbow();


const treeTexture = THREE.ImageUtils.loadTexture( '../models/tex1.jpg' );
const snowmanTexture = THREE.ImageUtils.loadTexture( '../models/snowman_DIF.jpg' );

class GameBlock {
  
  constructor(game, x, z) {
    this.game = game;
    this.x = x;
    this.z = z;
    this.step = this.game.scale;
    this.size = 15;
    this.mesh = this.buildMesh();
    this.mesh.castShadow = false;
    this.mesh.translateX((x - 1) * this.step);
    this.mesh.translateZ(z * this.game.zscale);
    this.game.scene.add(this.mesh);
    this.translateY();
  }

  buildGeometry() {
    return new THREE.BoxGeometry(this.size * 2, this.size, this.size / 4);
  }

  buildHitMaterial() {
    return new THREE.MeshPhongMaterial({map: texture});
  }

  buildMaterial() {
    const color = RAINBOW.next();
    return new THREE.MeshPhongMaterial({color: color, opacity: 0.8, transparent: true});
  }

  buildMesh() {
    //return new THREE.Mesh(this.buildGeometry(), this.buildMaterial());

    const g = new THREE.Group();
    for (var i = 0; i < 3; i++) {
      const m9 = treeModels.children[3].clone();
      m9.scale.x = m9.scale.y = m9.scale.z = 0.04;
      m9.material.map = treeTexture;
      m9.translateX(i * 8 - 22);
      //m9.rotateZ(Math.random() * 0.4 - 0.2);
      m9.rotateY(Math.random() * 0.6 - 0.3);
      g.add(m9);
    }
    g.translateX(-20);

    return g;
  }

  buildShape() {
    return new CANNON.Box(new CANNON.Vec3(this.size/2, this.size/2, this.size/8));
  }

  collide(p) {
    if (this.game.hero.capabilities.can("strong")) {
      const t = new TWEEN.Tween(this.mesh.position)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .to({y: 50, z: this.mesh.position.z + 150}, 500);
      const t2 = new TWEEN.Tween(this.mesh.rotation)
        .to({x: -2 * Math.PI}, 500);
      t2.start();
      //const t3 = new TWEEN.Tween(this.mesh.material)
      //  .to({opacity: 1});
      //t3.start();
      t.onComplete(() => {
        this.game.scene.remove(this.mesh);
      });
      t.start();
    } else {
      if (this.game.hero.mesh.position.z < this.mesh.position.z) {

        this.game.hero.speed = 0;
        //this.mesh.material.color = new THREE.Color(0xffffff);
        //this.mesh.material.opacity = 1.0;
        //this.mesh.material = this.buildHitMaterial();
        const t = new TWEEN.Tween(this.game.hero)
          .easing(TWEEN.Easing.Quadratic.In)
          .to({speed: this.game.baseSpeed}, 1000);
        t.start();
      }

    }

  }

  translateY() {
  }

}


class FlapBlock extends GameBlock {



}


class Coin extends GameBlock {

  buildGeometry() {
    //return new THREE.IcosahedronGeometry(this.size / 4, 0);
    const g = new THREE.CylinderGeometry(this.size / 3, this.size / 3, this.size / 8, 36); 
    g.rotateX(Math.PI / 2);
    g.rotateY(Math.random() * Math.PI);
    return g;
  }

  buildMaterial() {
    return new THREE.MeshPhongMaterial({color: "gold"});
  }

  buildMesh() {
    return new THREE.Mesh(this.buildGeometry(), this.buildMaterial());
  }

  buildShape() {
    return new CANNON.Sphere(this.size / 4);
  }

  collide(p) {
    const t = new TWEEN.Tween(this.mesh.position)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .to({y: 10, x: this.mesh.position.x - 10}, 100);
    t.onComplete(() => {
      this.game.scene.remove(this.mesh);
    });
    t.start();
    const t2 = new TWEEN.Tween(this.game.hero.mesh.scale)
      .easing(TWEEN.Easing.Quadratic.In)
      .to({x: 1.1, y: 1.1, z: 1.1}, 100);
    const t3 = new TWEEN.Tween(this.game.hero.mesh.scale)
      .easing(TWEEN.Easing.Quadratic.Out)
      .to({x: 1, y: 1, z: 1}, 100);
    t2.chain(t3);
    //t2.start();
    this.powerUp();
  }

  powerUp() {
    if (this.game.hero.speed < 4.5) {
      this.game.hero.speed *= 1.02;
    }
      this.game.score += 10;
  }

}


class StrongUp extends Coin {

  buildMaterial() {
    return new THREE.MeshLambertMaterial({color: 0xf63366, opacity: 0.3, shading: THREE.FlatShading});
  }

  powerUp() {
    this.game.hero.strongUp = true;
    this.game.score += 50;
    this.game.hero.capabilities.enable("strong", 200);
  }

}

class SpeedUp extends Coin {

  buildMaterial() {
    return new THREE.MeshLambertMaterial({color: 0x00ff00, opacity: 0.3, shading: THREE.FlatShading});
  }

  powerUp() {
    this.game.hero.speed = 4.5;
  }

}


class Capabilities{

   constructor() {
     this.caps = {};
   }

   tick() {
      for (var k in this.caps) {
        if (this.caps[k] > 0) {
          this.caps[k] -= 1;
        }
      }
   }

   enable(name, ticks) {
      this.caps[name] = ticks;
   }

   can(name) {
    return this.caps[name] > 0;
   }


}

class PowerUp {
}






class Coins {

  constructor(game) {
    this.game = game;
    this.buildMesh();
  }

  buildMesh() {
    for (var i = 0; i < 200; i++) {
      const row = this.game.level.get(i);
      for (var l = 0; l < 3; l++) {
        if (row[l] == 1) {
          const b = new GameBlock(this.game, l, i);
          this.game.level.addBlock(b, l, i);
        } else if (row[l] == 3) {
          const b = new FlapBlock(this.game, l, i);
          this.game.level.addBlock(b, l, i);
        } else if (row[l] == 2) {
          const b = new Coin(this.game, l, i);
          this.game.level.addBlock(b, l, i);
        } else if (row[l] == 4) {
          const b = new StrongUp(this.game, l, i);
          this.game.level.addBlock(b, l, i);
        } else if (row[l] == 5) {
          const b = new SpeedUp(this.game, l, i);
          this.game.level.addBlock(b, l, i);
        }
      }
    }
  }
}



class Spark {

  constructor(game, block) {
    this.game = game;
    this.block = block;
    this.numParticles = 100;
    this.speed = 10
    this.color = block.mesh.material.color;
    this.createAt(game.hero.mesh.position);
  }

  createAt(p) {
    this.particles = [];
    this.geometry = new THREE.Geometry();
    for (var i = 0; i < this.numParticles; i++) {
      this.geometry.vertices.push(new THREE.Vector3(p.x, p.y + 5, p.z));
    }
    const m = new THREE.PointsMaterial({size: 0.5});
    m.color = this.color;
    this.mesh = new THREE.Points(this.geometry, m);
    this.game.scene.add(this.mesh);
  }

  explode() {

    for (var i = 0; i < this.numParticles; i++) {
      const v = this.geometry.vertices[i];
      const dx = Math.random() * this.speed - this.speed / 2;
      const dy = Math.random() * this.speed - this.speed / 2;
      const dz = Math.random() * this.speed - this.speed / 2;
      const t = new TWEEN.Tween(v)
        .easing(TWEEN.Easing.Quintic.Out)
        .to({x: v.x + dx, y: v.y + dy, z: v.z + dz}, 500);
      t.onUpdate(() => {
        this.geometry.verticesNeedUpdate = true;
      });
      t.onComplete(() => {
        this.game.scene.remove(this.mesh);
      });
      t.start();
    }
    
  }
}



class Stars {

  constructor() {
    this.clock = new THREE.Clock();
    this.clock.start();
    this.geometry = new THREE.Geometry();
    for ( var zpos= 0; zpos < 6000; zpos+=1 ) {

        this.geometry.vertices.push(new THREE.Vector3(Math.random() * 300 - 150, Math.random() * 50, zpos));

    }

		const texture = THREE.ImageUtils.loadTexture( '../models/snowflake1.png' );

    //this.material = new THREE.PointsMaterial({size: 0.4});
    this.material = new THREE.ShaderMaterial({

				uniforms: {
					color:  { type: 'c', value: new THREE.Color(0xffffff) },
					height: { type: 'f', value: 50 },
					elapsedTime: { type: 'f', value: 0 },
					radiusX: { type: 'f', value: 5.5 },
					radiusZ: { type: 'f', value: 5.5 },
					size: { type: 'f', value: 100 },
					scale: { type: 'f', value: 8.0 },
  				opacity: { type: 'f', value: 1.0 },
				  texture: { type: 't', value: texture },
					speedH: { type: 'f', value: 1.0 },
					speedV: { type: 'f', value: 1.0 }
				},
				vertexShader: document.getElementById('step07_vs').textContent,
				fragmentShader: document.getElementById('step09_fs').textContent,
				blending: THREE.AdditiveBlending,
				transparent: true,
				depthTest: false
			});
    this.points = new THREE.Points(this.geometry, this.material);
  }

}

