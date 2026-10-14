/** The people on the water: a fisherman in a boat and a jetski rider. */
import * as THREE from 'three';

const hullShape = () => new THREE.SphereGeometry(1, 24, 12);

/** A simple figure. `palette` holds the shared `skin` and `dark` materials. */
function addPerson(kit, parent, palette, { position, shirt }) {
  const person = new THREE.Group();
  person.position.set(...position);
  parent.add(person);
  kit.cylinder([0.14, 0.18, 0.48], kit.material(shirt), [0, 0.52, 0], person); // torso
  kit.mesh(new THREE.SphereGeometry(0.13, 16, 12), palette.skin, [0, 0.9, 0], person); // head
  for (const x of [-0.11, 0.11]) {
    kit.box([0.12, 0.32, 0.15], palette.dark, [x, 0.15, 0], person); // legs
  }
  for (const x of [-0.2, 0.2]) {
    const arm = kit.cylinder([0.055, 0.055, 0.4], palette.skin, [x, 0.51, 0], person);
    arm.rotation.z = x > 0 ? -0.45 : 0.45;
  }
  return person;
}

function addFisherman(kit, boat, palette) {
  const fisherman = addPerson(kit, boat, palette, { position: [0.5, 0.42, 0], shirt: '#dad3a7' });
  kit.cylinder([0.28, 0.28, 0.055], kit.material('#cdb77c'), [0, 1.03, 0], fisherman); // hat
  const rod = kit.cylinder([0.013, 0.018, 2.3], palette.dark, [1, 1.6, 0], boat);
  rod.rotation.z = -0.7;
  kit.cylinder([0.003, 0.003, 1.7], kit.material('#d7e1dd'), [1.75, 1.25, 0], boat); // line
}

/** A small boat about 80 m offshore, rocking gently. */
export function createFishingBoat(scene, kit, palette) {
  const boat = new THREE.Group();
  boat.position.set(12, 0.1, -94);
  boat.rotation.y = -0.4;
  scene.add(boat);
  const hull = kit.mesh(hullShape(), kit.material('#f0e8cc'), [0, 0.1, 0], boat);
  hull.scale.set(2.3, 0.45, 0.85);
  kit.box([3.4, 0.08, 1.25], kit.material('#9a7851'), [0, 0.38, 0], boat); // deck
  kit.box([0.4, 0.65, 0.35], palette.dark, [-2, 0.25, 0], boat); // outboard motor
  addFisherman(kit, boat, palette);

  return {
    update(time) {
      boat.position.y = 0.1 + 0.04 * Math.sin(time * 1.5);
      boat.rotation.z = 0.015 * Math.sin(time * 1.5);
    },
  };
}

/** Translucent spray trailing behind the jetski. Returns its material. */
function addWake(kit, jetski) {
  const wake = kit.material('#e4f8f5', { transparent: true, opacity: 0.65, depthWrite: false });
  for (let i = 0; i < 18; i++) {
    const position = [-1.7 - i * 0.32, 0.03, Math.sin(i * 2.4) * (0.15 + i * 0.055)];
    const spray = kit.mesh(new THREE.SphereGeometry(1, 8, 6), wake, position, jetski);
    spray.scale.set(0.45, 0.035 + (i % 3) * 0.035, 0.12 + i * 0.025);
    spray.castShadow = false;
  }
  return wake;
}

/** A jetski circling an 18 m × 6 m ellipse at up to 14 m/s. */
export function createJetski(scene, kit, palette) {
  const jetski = new THREE.Group();
  scene.add(jetski);
  const hull = kit.mesh(hullShape(), kit.material('#f9c72c'), [0, 0.15, 0], jetski);
  hull.scale.set(1.55, 0.25, 0.52);
  kit.box([1.4, 0.18, 0.5], palette.dark, [-0.2, 0.4, 0], jetski); // seat
  kit.box([0.4, 0.4, 0.45], kit.material('#e95034'), [0.65, 0.55, 0], jetski); // console
  const rider = addPerson(kit, jetski, palette, { position: [-0.2, 0.48, 0], shirt: '#ff713e' });
  rider.rotation.z = -0.25;
  const wake = addWake(kit, jetski);

  return {
    wake,
    update(time) {
      const phase = (time * 14) / 9;
      const bob = 0.025 + 0.04 * Math.sin(time * 6);
      jetski.position.set(9 * Math.sin(phase), bob, -30 + 3 * Math.cos(phase));
      jetski.rotation.y = Math.atan2(3 * Math.sin(phase), 9 * Math.cos(phase));
    },
  };
}
