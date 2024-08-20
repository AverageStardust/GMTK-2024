// title:   GMTK 2024
// authors: Blessed BlessedEgg, Comet1772, lemgob, Wren
// desc:    
// site:    https://github.com/AverageStardust/GMTK-2024
// license: 
// version: 0.1
// script:  js

let MOUNTAIN_SPAWN = [30, 110];
let GYM_SPAWN = [194, 8];

let player;
let frame = 0;
let mode;
let exercisePhase = false;
let cameraPosition;

// 240, 136

function BOOT() {
	player = new Player();
	teleportMountain();
	cameraPosition = Vector2.zero();
}

function TIC() {
	// UPDATE
	player.update();

	// DRAW
	const { x, y } = getCameraPosition();
	map(x >> 3, y >> 3, 31, 18, -mod(x, 8), -mod(y, 8), -1);
	drawSunset(128, -48, Math.sin(time() * 0.0015) * 3);
	if (player.displayPosition.y > -28) {
		drawFlag(148, -24);
		player.draw();
	} else {
		player.draw();
		drawFlag(148, -24);
	}

	print("Strength", 191, 106, 0);
	print("Strength", 190, 105, 12);
	drawBar(Math.ceil(player.energy), 240, 111, 370, 5);
	print("Motivation", 185, 122, 0);
	print("Motivation", 184, 121, 12);
	drawBar(Math.ceil(player.motivation), 240, 127, 370, 5);

	frame++;
}

function drawSunset(u, v, shimmer) {
	const { x, y } = getCameraPosition();
	circ(u - x + 64, v - y - 4, 16, 4);
	spr(384, u - x + shimmer, v - y, 15, 1, false, 0, 16, 2);
}

function drawFlag(u, v) {
	const { x, y } = getCameraPosition();
	spr(362, u - x, v - y, 15, 1, false, 0, 2, 2);
}

function drawBar(amount, x, y, id, width) {
	for (let i = 0; i < amount; i++) {
		spr(id, x - width * (i + 1), y, 15);
	}
}

class Player {
	constructor() {
		this.setPosition(Vector2.zero());
		this.lastMovedFrame = -Infinity;
		this.moveDelay = 8;
		this.moveDirection = 1;
		this.strength = 2.5;
		this.energy = this.strength;
		this.motivation = 0;
		this.climbing = false;
	}

	setPosition(position) {
		this.position = position;
		this.displayPosition = this.position.mul(8);
	}

	update() {
		const targetDisplayPosition = this.position.mul(8);
		this.displayPosition = this.displayPosition.moveTo(targetDisplayPosition, 1);
		cameraPosition = this.displayPosition.add(new Vector2(8, 8));
		this.control();
	}

	draw() {
		let id = 256;
		let flip = false;
		let drawArrow = false;
		let arrowRotation = 0;

		if (mode === "pullup") {
			id = exercisePhase ? 322 : 320;
			drawArrow = true;
			arrowRotation = exercisePhase ? 2 : 0;
		} else if (mode === "tredmill") {
			id = 292;
			flip = exercisePhase;
			drawArrow = true;
			arrowRotation = exercisePhase ? 1 : 3;
		} else if (this.isMoving()) {
			let movePhase = time() % 500 < 250;
			if (this.climbing) {
				id = 292;
				flip = movePhase;
			} else {
				switch (this.moveDirection) {
					case 0:
						id = 258;
						flip = movePhase;
						break;
					case 1:
						id = 260;
						flip = movePhase;
						break;
					case 2:
						id = movePhase ? 288 : 290;
						flip = true;
						break;
					case 3:
						id = movePhase ? 288 : 290;
						break;
				}
			}
		}

		const { x, y } = getCameraPosition();
		const { x: u, y: v } = this.displayPosition;
		spr(id, u - x, v - y, 15, 1, flip, 0, 2, 2);

		if (drawArrow) {
			spr(352, u - x, v - y + 24, 15, 1, false, arrowRotation, 2, 2);
		}
	}

	control() {
		this.climbing = false;
		if (mode === "pullup") {
			if (!this.isMoving()) {
				if ((btn(2) || btn(3))) {
					this.moveDown();
					this.moveDown();
					enterGym();
				}
				if (btn(exercisePhase ? 1 : 0) && !btn(exercisePhase ? 0 : 1)) {
					exercisePhase = !exercisePhase;
					this.addStength(0.05);
				}
			}
			return;
		} else if (mode === "tredmill") {
			if (!this.isMoving()) {
				if ((btn(0) || btn(1))) {
					this.moveLeft();
					this.moveLeft();
					enterGym();
				}
				if (btn(exercisePhase ? 3 : 2) && !btn(exercisePhase ? 2 : 3)) {
					exercisePhase = !exercisePhase;
					this.addStength(0.05);
				}
			}
			return;
		}

		if (this.isMoving()) {
			if (mode === "gym") {
				if (this.getNeighbourFlag(0, -1, 6) && this.getNeighbourFlag(1, -1, 6)) {
					this.moveUp();
					enterPullup();
				}
				if (this.getNeighbourFlag(0, 0, 7) || this.getNeighbourFlag(1, 0, 7)) {
					if (this.getNeighbourFlag(0, -1, 7) || this.getNeighbourFlag(1, -1, 7)) {
						this.moveUp();
					}
					if (this.getNeighbourFlag(-1, 0, 7)) {
						this.moveLeft();
					} else if (this.getNeighbourFlag(2, 0, 7)) {
						this.moveRight();
					}
					enterTredmill();
				}
			}
			return;
		}

		if (btn(0) && btn(2)) this.moveUpLeft();
		else if (btn(1) && btn(3)) this.moveDownRight();
		else if (btn(2) && btn(1)) this.moveLeftDown();
		else if (btn(3) && btn(0)) this.moveRightUp();
		else if (btn(0)) this.moveUp();
		else if (btn(1)) this.moveDown();
		else if (btn(2)) this.moveLeft();
		else if (btn(3)) this.moveRight();

		if (this.isMoving()) {
			const energyCost = Math.max(
				this.getNeighbourEnergyCost(0, 1),
				this.getNeighbourEnergyCost(1, 1));

			this.energy -= energyCost * 0.1;
			if (btn(0) && !btn(1)) {
				this.motivation += energyCost * (1 - this.position.y / 180) * 0.1;
				this.climbing = true;
			}
			if (this.energy < 0.0) {
				teleportGym();
			}
		}
	}

	addStength(amount) {
		this.strength += amount;
		this.energy = this.strength;
		this.motivation -= amount;
		if (this.motivation < 0) {
			teleportMountain();
		}
	}

	moveUpLeft() {
		if (this.getNeighbourFlag(0, 0, 0) || this.getNeighbourFlag(1, 0, 0)) {
			this.moveLeft();
			this.moveUp();
		} else {
			this.moveUp();
			this.moveLeft();
		}
	}

	moveDownRight() {
		if (this.getNeighbourFlag(0, 2, 0) || this.getNeighbourFlag(1, 2, 0)) {
			this.moveRight();
			this.moveDown();
		} else {
			this.moveDown();
			this.moveRight();
		}
	}

	moveLeftDown() {
		if (this.getNeighbourFlag(-1, 1, 0)) {
			this.moveDown();
			this.moveLeft();
		} else {
			this.moveLeft();
			this.moveDown();
		}
	}

	moveRightUp() {
		if (this.getNeighbourFlag(2, 1, 0)) {
			this.moveUp();
			this.moveRight();
		} else {
			this.moveRight();
			this.moveUp();
		}
	}

	moveUp() {
		if (this.getNeighbourFlag(0, 0, 0) || this.getNeighbourFlag(1, 0, 0)) return;
		this.position.y--;
		this.lastMovedFrame = frame;
		this.moveDirection = 0;
	}

	moveDown() {
		if (this.getNeighbourFlag(0, 2, 0) || this.getNeighbourFlag(1, 2, 0)) return;
		this.position.y++;
		this.lastMovedFrame = frame;
		this.moveDirection = 1;
	}

	moveLeft() {
		if (this.getNeighbourFlag(-1, 1, 0)) return;
		this.position.x--;
		this.lastMovedFrame = frame;
		this.moveDirection = 2;
	}

	moveRight() {
		if (this.getNeighbourFlag(2, 1, 0)) return;
		this.position.x++;
		this.lastMovedFrame = frame;
		this.moveDirection = 3;
	}

	isMoving() {
		return this.lastMovedFrame + this.moveDelay > frame;
	}

	getNeighbourEnergyCost(offsetX, offsetY) {
		let lowBit = this.getNeighbourFlag(offsetX, offsetY, 1);
		let highBit = this.getNeighbourFlag(offsetX, offsetY, 2);
		return (lowBit ? 1 : 0) + (highBit ? 2 : 0);
	}

	getNeighbourFlag(offsetX, offsetY, flag) {
		let { x, y } = this.position.add(new Vector2(offsetX, offsetY));
		return fget(mget(mod(x, 240), mod(y, 136)), flag);
	}
}

function getCameraPosition() {
	let vector = cameraPosition.sub(new Vector2(120, 68));

	if (mode !== "climb") {
		vector = new Vector2(1440, 0);
	}

	return vector;
}

function teleportMountain() {
	player.setPosition(new Vector2(...MOUNTAIN_SPAWN));
	player.motivation = -0.5;
	mode = "climb";
	music(0, 0, 0, true);
}

function teleportGym() {
	player.setPosition(new Vector2(...GYM_SPAWN));
	player.energy = player.strength;
	enterGym();
	music();
}

function enterPullup() {
	mode = "pullup";
	exercisePhase = false;
}

function enterTredmill() {
	mode = "tredmill";
	exercisePhase = false;
}

function enterGym() {
	mode = "gym";
}

class Vector2 {
	static zero() {
		return new Vector2(0, 0);
	}

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	add(vector) {
		return new Vector2(this.x + vector.x, this.y + vector.y);
	}

	sub(vector) {
		return new Vector2(this.x - vector.x, this.y - vector.y);
	}

	mul(scaler) {
		return new Vector2(this.x * scaler, this.y * scaler);
	}

	moveTo(vector, step) {
		return new Vector2(
			moveTo(this.x, vector.x, step),
			moveTo(this.y, vector.y, step));
	}
}

function mod(n, m) {
	return ((n % m) + m) % m;
};

function moveTo(start, end, step) {
	let differance = end - start;
	differance = Math.sign(differance) * step;
	return start + differance;
}

// <TILES>
// 000:6666666666666666666666666666666666666666666666666666666666666666
// 001:6666666666666666666666666666666666666666666666666666666666666666
// 002:6666666666666666666666666666666666666666666666666666666666666766
// 003:6666666666666666666666666666666666666666666666666666666666666666
// 004:6666666666666666663366666344366663443667663366676666666666666666
// 005:6666666666666666666666666666666666666666766666667666666666666666
// 006:4444444444444444444444444444444444444444444444444444444444444444
// 007:4444444444444444444444444444444444444444444444444444444444444444
// 008:4444444444444444444444444444444444444444444444444444444444444344
// 009:4444444444444444444444444444444444444444444444444444444444344444
// 010:4444444444444444444444444444244444444444444444444444444444444444
// 011:4444444444444444444334444443344444444444244444444444444444444444
// 012:bbbbbbbbbbbbbbbbbbbbbbccbbbbbcccbbbddcccbbcccdccbbbcccccbbbbbbbb
// 013:bbbbbbbbbbbbbbbbdbbbbbbbcdbbbbbbccdccbbbccccccbbcccccbbbbbbbbbbb
// 014:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 015:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 016:6666666666666666666666666666666666666666666666666666666666666666
// 017:6666666666666666666666666666666666666666666666666666666666666666
// 018:6666667666666677666666776677666766677766666677666666666666666666
// 019:6666666666666666666666666666666666666666666666666666666666666666
// 020:6666666666776666666776666666666666666663666666636666666666666666
// 021:6666676666667766666676663366666644366666443666663366666666666666
// 022:4444444444444444444444444444444444444444444444444444444444444444
// 023:4444444444444444444444444444444444444444444444444444444444444444
// 024:4444443444444432444444334433444344433344444433444444444444444444
// 025:4344444423444444334444443444334444333444443344444444444444444444
// 026:4424444444444444443344424433444444444444444444444444424444444444
// 027:4444444444442444444444444444444444444444444444444444444444444444
// 028:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 029:bbbbbbbbbbbbbbbbbbcdbbbbbcccdcbbbbcccccbbbbbccbbbbbbbbbbbbbbbbbb
// 030:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 031:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 032:0666666606666666006666660066666600666666060666660606666607606666
// 033:6666666666666666666666666666666666666666666666666666666666666666
// 034:6666666666666666666666666666666666666666666666666666666666666666
// 035:6666666666666666666666666666666666666666666666666666666666666666
// 036:6666666666666666666666666666666666666666666666666666666666666666
// 037:6666666066666660666666006666660066666600666660606666606066660670
// 038:0444444404444444004444440044444400444444040444440404444403404444
// 039:4444444444444444444444444444444444444444444444444444444444444444
// 040:4444444444444444444444444444444444444444444444444444444444444444
// 041:4444444444444444444444444444444444444444444444444444444444444444
// 042:4444444444444444444444444444444444444444444444444444444444444444
// 043:4444444044444440444444004444440044444400444440404444404044440430
// 044:bbbbbbbbbbbbbbbbbbddbddbbbbbdbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 045:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 046:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 047:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 048:0760666607760666077760000777766607777777077777770777777706777777
// 049:6666666666666666000000006666666677777777777777777777777777777777
// 050:6666666666666666000000006666666677777777777777777777777777777777
// 051:6666666666666666000000006666666677777777777777777777777777777777
// 052:6666666666666666000000006666666677777777777777777777777777777777
// 053:6666067066606770000677706667777077777770777777707777777077777760
// 054:0340444403340444033340000333344403333333033333330333333304333333
// 055:4444444444444444000000004444444433333333333333333333333333333333
// 056:4444444444444444000000004444444433333333333333333333333333333333
// 057:4444444444444444000000004444444433333333333333333333333333333333
// 058:4444444444444444000000004444444433333333333333333333333333333333
// 059:4444043044404330000433304443333033333330333333303333333033333340
// 060:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 061:bddbddbbbbbdbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 062:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 063:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
// 064:0067777707066777077006660777700007777777077777770777777706777777
// 065:7777777777777777666667770000066677777000777777777777777777777777
// 066:7777777777777777667766770066006677007700777777777777777777777777
// 067:7777777777777777776677666600660000770077777777777777777777777777
// 068:7777777777777777777666666660000000077777777777777777777777777777
// 069:7777760077766070666007700007777077777770777777707777777077777760
// 070:0043333303044333033004440333300003333333033333330333333304333333
// 071:3333333333333333444443330000044433333000333333333333333333333333
// 072:3333333333333333443344330044004433003300333333333333333333333333
// 073:3333333333333333334433444400440000330033333333333333333333333333
// 074:3333333333333333333444444440000000033333333333333333333333333333
// 075:3333340033344030444003300003333033333330333333303333333033333340
// 076:aaaaaaaaaaaaaaaaaaaaaaaaaabbaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 077:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 078:6666600066600555660555556605555560555555605555550555555505555555
// 079:0006666655500666555550665555506655555506555555065555555055555550
// 080:0067777707066777077006660777700007777777077777770777777706777777
// 081:7777777777777777666667770000066677777000777777777777777777777777
// 082:7777777777777777667766770066006677007700777777777777777777777777
// 083:7777777777777777776677666600660000770077777777777777777777777777
// 084:7777777777777777777666666660000000077777777777777777777777777777
// 085:7777760077766070666007700007777077777770777777707777777077777760
// 086:0043333303044333033004440333300003333333033333330333333304333333
// 087:3333333333333333444443330000044433333000333333333333333333333333
// 088:3333333333333333443344330044004433003300333333333333333333333333
// 089:3333333333333333334433444400440000330033333333333333333333333333
// 090:3333333333333333333444444440000000033333333333333333333333333333
// 091:3333340033344030444003300003333033333330333333303333333033333340
// 092:aaaaabbaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbaaaaaaaaaaaaaaaaaaa
// 093:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbaaaaaaaaaaaaaaaaaaaaaaaaaa
// 094:0565566560565556606665656600660660430040660044446604300466600660
// 095:5665565065556506565666066066006604003406444400664003406606600666
// 096:0067777707066777077006660777700007777777077777770677777700677777
// 097:7777777777777777666667770000066677777000777777777777777777777777
// 098:7777777777777777667766770066006677007700777777777777777777777777
// 099:7777777777777777776677666600660000770077777777777777777777777777
// 100:7777777777777777777666666660000000077777777777777777777777777777
// 101:7777760077766070666007700007777077777770777777707777776077777600
// 102:0043333303044333033004440333300003333333033333330433333300433333
// 103:3333333333333333444443330000044433333000333333333333333333333333
// 104:3333333333333333443344330044004433003300333333333333333333333333
// 105:3333333333333333334433444400440000330033333333333333333333333333
// 106:3333333333333333333444444440000000033333333333333333333333333333
// 107:3333340033344030444003300003333033333330333333303333334033333400
// 108:4440004444033200440301224440403244000331401123224033102203300022
// 109:4044440003040030033033042031204420123304222003302204400412044444
// 110:ccccccccccc0c0cccccc0ccccc000cccc0ed000ccc00dde0cccc00ddccccc0dd
// 111:cccccccccc0cccccc0cc0cccc0c0d0ccc00d0ccc0ed0ccccdd0ccccced0ccccc
// 112:0706677707700666077770000777777707777777607777776607777766600000
// 113:7777777766666777000006667777700077777777777777777777777700000000
// 114:7777777766776677006600667700770077777777777777777777777700000000
// 115:7777777777667766660066000077007777777777777777777777777700000000
// 116:7777777777766666666000000007777777777777777777777777777700000000
// 117:7776607066600770000777707777777077777770777777067777706600000666
// 118:0304433303300444033330000333333303333333603333336603333366600000
// 119:3333333344444333000004443333300033333333333333333333333300000000
// 120:3333333344334433004400443300330033333333333333333333333300000000
// 121:3333333333443344440044000033003333333333333333333333333300000000
// 122:3333333333344444444000000003333333333333333333333333333300000000
// 123:3334403044400330000333303333333033333330333333063333306600000666
// 124:4004402144444022444401224400122240112212440021224402100244400440
// 125:1204444412044444221044442221004421221104221200441001204404400444
// 126:ccccc0deccccc0ddcccc0eddcc00edddc0eeddedcc00deddcc0de00dccc00cc0
// 127:ed0ccccced0cccccdde0ccccddde00ccdeddee0cdded00cce00ed0cc0cc00ccc
// 128:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 129:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 130:ccccccccccccccccccccccccccccccdcccccccccccccccccccdccccccccccccc
// 131:cccccccccccccccccccccccccccccccccccccccccccdcccccccccccccccccccc
// 132:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 133:cccccccccccccccccccccdccccccdccccccddccccccddcccdccdccccddcccccc
// 134:6666666666666666666666666666666666666666666666666666666666666666
// 135:6666666666666666666666666666666666666666666666666666666666666666
// 136:4444444444444444444444444444444444444444444444444444444444444444
// 137:4444444444444444444444444444444444444444444444444444444444444444
// 138:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 139:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 140:9999999999999999999999999999999999999999999999999999999999999999
// 141:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
// 142:9990000099906666999066669990666699906666999066669990666699906666
// 143:00000ddd56560ddd65650ddd66560ddd66650ddd66660ddd66660ddd66660ddd
// 144:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 145:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 146:ccccccccccccccccccccccccccccdccccccccccccccccccccccccccccccccccc
// 147:dcccccccccccccccccccccccccccccccccccccccccccdccccccccccccccccccc
// 148:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 149:cdcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 150:6666666666666666000000006666666677777777770707777770777777777777
// 151:6666666666666666000000006666666677777777777777777707770777700077
// 152:4444444444444444000000004444444433333333330303333330333333333333
// 153:4444444444444444000000004444444433333333333333333303330333300033
// 154:cccccccccccccccc00000000ccccccccdddddddddd0d0dddddd0dddddddddddd
// 155:cccccccccccccccc00000000ccccccccdddddddddddddddddd0ddd0dddd000dd
// 156:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 157:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 158:eee06666eee06666eee06666eee05666eee06566eee05656eee06565eee00000
// 159:66660aaa66660aaa66660aaa66660aaa66660aaa66660aaa66660aaa00000aaa
// 160:0ccccccc0ccccccc00cccccc00cccccc00cccccc0c0ccccc0c0ccccc0dc0cccc
// 161:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 162:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 163:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 164:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 165:ccccccc0ccccccc0cccccc00cccccc00cccccc00ccccc0c0ccccc0c0cccc0cd0
// 166:7777777777777777667766770066006677007700777777777707770777700077
// 167:7777777777777777776677666600660000770077777777777777777777070777
// 168:3333333333333333443344330044004433003300333333333303330333300033
// 169:3333333333333333334433444400440000330033333333333333333333030333
// 170:ddddddddddddddddccddccdd00cc00ccdd00dd00dddddddddd0ddd0dddd000dd
// 171:ddddddddddddddddddccddcccc00cc0000dd00dddddddddddddddddddd0d0ddd
// 172:9999999999999999990099999033000090334444903300009900999999999999
// 173:dddddddddddddddd00dddddd330ddddd330ddddd330ddddd00dddddddddddddd
// 174:9999000099990ddd99900ddd990e000090e0eeee90e0e2ee90e0000090e0dddd
// 175:0000ddddddd0ddddddd00ddd0000e0ddeeee0e0dee6e0e0d00000e0ddddd0e0d
// 176:0dc0cccc0ddc0ccc0dddc0000ddddccc0ddddddd0ddddddd0ddddddd0cdddddd
// 177:cccccccccccccccc00000000ccccccccdddddddddddddddddddddddddddddddd
// 178:cccccccccccccccc00000000ccccccccdddddddddddddddddddddddddddddddd
// 179:cccccccccccccccc00000000ccccccccdddddddddddddddddddddddddddddddd
// 180:cccccccccccccccc00000000ccccccccdddddddddddddddddddddddddddddddd
// 181:cccc0cd0ccc0cdd0000cddd0cccdddd0ddddddd0ddddddd0ddddddd0ddddddc0
// 182:7777777777777777667766770066006677007700777777777707077777707777
// 183:7770777777777777776677666600660000770077777777777077077777007777
// 184:3333333333333333443344330044004433003300333333333303033333303333
// 185:3330333333333333334433444400440000330033333333333033033333003333
// 186:ddddddddddddddddccddccdd00cc00ccdd00dd00dddddddddd0d0dddddd0dddd
// 187:ddd0ddddddddddddddccddcccc00cc0000dd00ddddddddddd0dd0ddddd00dddd
// 188:eeee00eeeee0dd0eee0edd00ee0edd00eee0dd0eeeee00eeeeeeeeeeeeeeeeee
// 189:aaa00aaaaa0dd0aa000dde0a000dde0aaa0dd0aaaaa00aaaaaaaaaaaaaaaaaaa
// 190:e0e0cccce0e0dddde0e0cccce0e0dddde0e0cccce000dddde0e00000e000eeee
// 191:cccc0e0adddd0e0acccc0e0adddd0e0acccc0e0adddd000a00000e0aaaaa000a
// 192:00cddddd0d0ccddd0dd00ccc0dddd0000ddddddd0ddddddd0ddddddd0cdddddd
// 193:ddddddddddddddddcccccddd00000cccddddd000dddddddddddddddddddddddd
// 194:ddddddddddddddddccddccdd00cc00ccdd00dd00dddddddddddddddddddddddd
// 195:ddddddddddddddddddccddcccc00cc0000dd00dddddddddddddddddddddddddd
// 196:dddddddddddddddddddcccccccc00000000ddddddddddddddddddddddddddddd
// 197:dddddc00dddcc0d0ccc00dd0000dddd0ddddddd0ddddddd0ddddddd0ddddddc0
// 198:7777777777777777667766770066006677007700777777777707770777700077
// 199:7777777777777777776677666600660000770077777777777777777777707077
// 200:3333333333333333443344330044004433003300333333333303330333300033
// 201:3333333333333333334433444400440000330033333333333333333333303033
// 202:ddddddddddddddddccddccdd00cc00ccdd00dd00dddddddddd0ddd0dddd000dd
// 203:ddddddddddddddddddccddcccc00cc0000dd00ddddddddddddddddddddd0d0dd
// 204:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 205:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 206:e0eeeeee0e0eeeee0de00000e0ddddddee000000eeeeeeeeeeeeeeeeeeeeeeee
// 207:eeeeee0eeeeee0e000000ed0dddddd0e000000eeeeeeeeeeeeeeeeeeeeeeeeee
// 208:00cddddd0d0ccddd0dd00ccc0dddd0000ddddddd0ddddddd0ddddddd0cdddddd
// 209:ddddddddddddddddcccccddd00000cccddddd000dddddddddddddddddddddddd
// 210:ddddddddddddddddccddccdd00cc00ccdd00dd00dddddddddddddddddddddddd
// 211:ddddddddddddddddddccddcccc00cc0000dd00dddddddddddddddddddddddddd
// 212:dddddddddddddddddddcccccccc00000000ddddddddddddddddddddddddddddd
// 213:dddddc00dddcc0d0ccc00dd0000dddd0ddddddd0ddddddd0ddddddd0ddddddc0
// 214:7777777766776677006600667700770077777777777707077777707700000000
// 215:7777077777667766660066000077007777777777777077077777007700000000
// 216:3333333344334433004400443300330033333333333303033333303300000000
// 217:3333033333443344440044000033003333333333333033033333003300000000
// 218:ddddddddccddccdd00cc00ccdd00dd00dddddddddddd0d0dddddd0dd00000000
// 219:dddd0dddddccddcccc00cc0000dd00ddddddddddddd0dd0ddddd00dd00000000
// 220:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 221:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 222:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 223:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// 224:00cddddd0d0ccddd0dd00ccc0dddd0000ddddddd0ddddddd0cdddddd00cddddd
// 225:ddddddddddddddddcccccddd00000cccddddd000dddddddddddddddddddddddd
// 226:ddddddddddddddddccddccdd00cc00ccdd00dd00dddddddddddddddddddddddd
// 227:ddddddddddddddddddccddcccc00cc0000dd00dddddddddddddddddddddddddd
// 228:dddddddddddddddddddcccccccc00000000ddddddddddddddddddddddddddddd
// 229:dddddc00dddcc0d0ccc00dd0000dddd0ddddddd0ddddddd0ddddddc0dddddc00
// 230:000000000ddddddd0ddddddd0ddddddd0ddddddd0ddddddd0ddddddd0ddddddd
// 231:00000000cccddddedcccddddddcccddddddcccddddddcccedddddcceddddddce
// 232:00000000dddddcddddddddcddddddddcdddddddddddddddddddddddddddddddd
// 233:00000000ddccdddedddccddeddddccdecddddcceddddddcedddddddeddddddde
// 234:00000000dddddddddddddddddddddddddddddddddddddddddddddddddddddddd
// 235:00000000dcddddd0ddcdddd0dddcddd0ddddcdd0dddddcd0ddddddc0cdddddd0
// 236:eeeeeeeeeeeeeeeeeee44444eee44444eee4444aeee4444aeee444abeee444ab
// 237:eeeeeeeeeeeeeeee44433eee44443eeeb4444eeeb4444eeebb444eeebb444eee
// 238:eeeeeeeeeeeeeeeee0000000e0dddddde0dddddde0dddddce0dddddce0dddd33
// 239:eeeeeeeeeeeeeeee0000000edddddd0edddddd0ecddddd0ecddddd0e33dddd0e
// 240:0d0ccddd0dd00ccc0dddd0000ddddddd0ddddddd40dddddd440ddddd44400000
// 241:ddddddddcccccddd00000cccddddd000dddddddddddddddddddddddd00000000
// 242:ddddddddccddccdd00cc00ccdd00dd00dddddddddddddddddddddddd00000000
// 243:ddddddddddccddcccc00cc0000dd00dddddddddddddddddddddddddd00000000
// 244:dddddddddddcccccccc00000000ddddddddddddddddddddddddddddd00000000
// 245:dddcc0d0ccc00dd0000dddd0ddddddd0ddddddd0dddddd04ddddd04400000444
// 246:0ddddddd0ddddddd0cdddddd0ccddddd0dccdddd0ddccddd0dddccdd00000000
// 247:dddddddedddddddedddddddedddddddedcdddddeddcddddedddcddde00000000
// 248:cdddddddccdddddddccdddddddccdddddddccdddddddccdddddddccd00000000
// 249:dddddddedddddddedddddddeddddddddddddddddddddddddddddddde00000000
// 250:cdddddddccddddddcccddddddcccddddddcccddddddcccddddddcccd00000000
// 251:dcddddd0ddcdddd0ddddddd0ddddddd0ddddddd0ddddddd0ddddddd000000000
// 252:eee44abbeee44abbeee44abbeee444abeee34444eee33444eeeeeeeeeeeeeeee
// 253:bbb44eeebcb44eeeccb44eeebb444eee44444eee44444eeeeeeeeeeeeeeeeeee
// 254:e0ddd333e0dd6666e0d66666e0555555e0555555e0000000eeeeeeeeeeeeeeee
// 255:333ddd0e6666dd0e66666d0e5555550e5555550e0000000eeeeeeeeeeeeeeeee
// </TILES>

// <SPRITES>
// 000:fffff000ffff0aaafff0aaaafff0aaaafff00bbbfff04000fff04404ffff0344
// 001:00ffffffaa0fffffaaa0ffffaaa0ffffbb00ffff0040ffff0440ffff430fffff
// 002:ffffff00fffff0aaffff0aaaffff0aaaffff00acffff0800ffff0888fffff088
// 003:000fffffaaa0ffffaaaa0fffaaaa0fffcca00fff00080fff88880fff8880ffff
// 004:ffffff00fffff0aaffff0aaaffff0aaaffff00bbffff0400ffff0440fffff034
// 005:000fffffaaa0ffffaaaa0fffaaaa0fffbbb00fff00040fff40440fff4430ffff
// 006:fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000
// 007:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 008:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 009:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 010:fffffffffffffffffffffffffffffffffffffffffffffffffffff000ffff0222
// 011:ffffffffffffffffffffffffffffffffffffffffffffffffffffffff0fffffff
// 016:fff0b000ff0bbbbbff0b0bbbff040bbbfff00888ffff0880ffff0880fffff000
// 017:00b0ffffbbbb0fffbb0b0fffbb040fff8800ffff880fffff880fffff00ffffff
// 018:ffff0b00fff0bbbbff0bb0bbff0400bbfff0f088fffff088fffff088ffffff00
// 019:000b0fffbbbbb0ffbbb0b0ffbbb00fff8880ffff0880ffff000fffffffffffff
// 020:ffff0b00fff0bbbbfff0b0bbfff0440bfff04408ffff0088ffffff00ffffffff
// 021:000b0fffbbbbb0ffbbb040ffbbb00fff8880ffff0880ffff0880fffff00fffff
// 022:ffff0222ffff0121ffff0442fffff022fffff022fffff022fffff022ffffff00
// 023:0fffffff0fffffff0fffffff200fffff2210ffff12210fff21120fff0000ffff
// 024:fffffffffffff000ffff0222ffff0121ffff0442fffff022fffff022ffffff00
// 025:ffffffffffffffff0fffffff000fffff0210ffff12210fff21120fff0000ffff
// 026:ffff0121ffff0442fffff032fffff022fffff022fffff022fffff022ffffff00
// 027:0fffffff0fffffff0fffffff200fffff2210ffff12210fff21120fff0000ffff
// 032:fffff000ffff0aaafff0aaaafff0aaaafff0caaafff08884fff08844ffff0344
// 033:00ffffffaa0fffffaaa0ffffaaa00fffaaabb0ff40400fff4440ffff440fffff
// 034:fffff000ffff0aaafff0aaaafff0aaaafff0caaafff08884fff08844ffff0344
// 035:00ffffffaa0fffffaaa0ffffaaa00fffaaabb0ff40400fff3440ffff440fffff
// 036:ffffff00ffbff0aaffff0aaafbff0aaaffff00acfff00800ff040888ff0ab088
// 037:000fffffaaa0ffffaaaa0fffaaaa0fffcca00fff00080fff88880fff8880ffff
// 038:fffffffffffffffffffffffffffffffffffffff0ffffff0cfffff0ccfffff0c0
// 039:ffffffffffffffffffffffffffffffff00ffffffcc0fffffccc0ffffc0c0ffff
// 040:fffffffffffffffffffffffffffffffffffffff0ffffff0cfffff0ccfffff0c0
// 041:ffffffffffffffffffffffffffffffff00ffffffcc0fffffccc0ffffccc0ffff
// 042:fffffffffffffffffffffffffffffffffffffff0ffffff0cfffff0ccfffff0cc
// 043:ffffffffffffffffffffffffffffffff00ffffffcc0fffffccc0ffffccc0ffff
// 048:ffff0044fff0bbbbff0bb00bff040bbbfff00999ffff0899fff08800fff00000
// 049:400fffffbb00ffffbb040fffbb00ffff990fffff990fffff9990ffff0000ffff
// 050:ffff0044ffff00bbffff0b0bffff0bb0ffff0999fff09990fff0990fffff000f
// 051:400fffff0b0fffffb00fffffb40fffff000fffff880fffff0880fffff000ffff
// 052:fff0ab00ffff0abbfffff0bbfffff008ffff0888fffff000ffffffffffffffff
// 053:00040fffbbbb0fffbbba0fff8880ffff0880fffff080fffff0880fffff00ffff
// 054:fffff0ccfffff00cfffff0d0ffff0ddcffff0ddcffff0decfffff00dfffffff0
// 055:4cc0ffff4c00ffff00d0ffffccdd0fffdcdd0fffcced0fffcd00ffff00ffffff
// 056:fffff04cfffff04cfffff000ffff0eccffff0ecdffff0eccfffff0dcffffff00
// 057:ccc0ffffcc00ffff00d0ffffc0dd0fffccdd0fffdced0fffcc00ffff00ffffff
// 058:fffff0c0fffff00cfffff0d0ffff0ddcffff0ddcffff0decfffff00dfffffff0
// 059:c0c0ffff4c00ffff00d0ffffccdd0fffdcdd0fffcced0fffcd00ffff00ffffff
// 064:fffff000ffff0aaafff0aaaafff0aaaafff00accff008000f0408888f0bb0888
// 065:00ffffffaa0fffffaaa0ffffaaa0ffffca00ffff00800fff888040ff880bb0ff
// 066:ffbff000ffff0aaafbf0aaaafff0aaaafff00accff008000f0400888f0bbb000
// 067:00ffffffaa0fffffaaa0fbffaaa0ffffca00ffbf00800fff880040ff00bbb0ff
// 068:ffffff00ff2ff0aaff2f0aaaffff0aaaff2f00acfff00800ff040888ff0ab088
// 069:000fffffaaa0ff2faaaa0f2faaaa0fffcca00f2f00080fff8888040f8880ba0f
// 070:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff
// 071:fffffffffffffffffffffffffffffffffffffffffffffffff00fffff060fffff
// 072:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff
// 073:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 074:ffffffffffffffffffffffffffffffffffffffffffffffffffff00fffff0550f
// 075:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 080:ff0bb000fff0bbbbffff0bbbffff0bbbffff0888ffff0880ffff0880fffff000
// 081:00bb0fffbbb0ffffbb0fffffbb0fffff880fffff880fffff880fffff00ffffff
// 082:ff00bbbbffff0bbbffff0bbbffff0888ffff0880ffff0880fffff000ffffffff
// 083:bbb00fffbb0fffffbb0fffff880fffff880fffff880fffff00ffffffffffffff
// 084:fff0ab00ffff0abbfffff0bbfffff088fffff088fffff080ffff0880fffff00f
// 085:000ba0ffbbba0fffbbb0ffff8880ffff0880fffff080fffff0880fffff00ffff
// 086:fff05500ff055550ff005050ff044505fff00055ffff0655fffff066ffffff00
// 087:660000ff605550ff05560fff5560ffff5500ffff5550ffff660fffff00ffffff
// 088:fff05500ff055550ff005050ff044505ff000055f0660655f000f066ffffff00
// 089:ffffffffffffffff000fffff5550ffff56550fff506550ff660000ff00ffffff
// 090:ff055550ff005050ff044500fff00055ffff0556ffff0655fffff066ffffff00
// 091:fffffffffff00fff00050fff55650fff6650ffff5550ffff660fffff00ffffff
// 096:fffffffffff22222ff2cccccf2ccccccf2ccccc2f2cccc22f2ccc222f2ccccc2
// 097:ffffffff22222fffccccc2ffcccccc2f2ccccc2f22cccc2f222ccc2f2ccccc2f
// 098:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 099:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 100:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 101:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 102:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 103:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 104:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 105:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 106:ffffffffffffffffffffffff00ffffff0200ffff022200ff0222220002222221
// 107:ffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ffffff
// 112:f2ccccc2f2ccccc2f2ccccc2f2ccccc2f2ccccccff2cccccfff22222ffffffff
// 113:2ccccc2f2ccccc2f2ccccc2f2ccccc2fcccccc2fccccc2ff22222fffffffffff
// 114:ffffffffffffffff0000ffff0440ffff0440ffff0440ffff0440ffff0000ffff
// 115:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 116:ffffffffffffffff0000ffff0ff0ffff0ff0ffff0ff0ffff0ff0ffff0000ffff
// 117:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 118:fffffffffffffffff00f00ff0220220f0222220ff02220ffff020ffffff0ffff
// 119:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 120:fffffffffffffffff00f00ff0ff0ff0f0fffff0ff0fff0ffff0f0ffffff0ffff
// 121:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 122:02222100022100ff0200ffff00ffffff00ffffff00ffffff00ffffff00ffffff
// 123:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 128:f3333333ffff3333fffff334ffffffffffffffffffffffffffffffffffffffff
// 129:333333333344444444433333f4444444ffff4444ffffffffffffffff44444444
// 130:333333333333333333333333444444444444444444444444ff44444444444444
// 131:3333333333333444333333334444444444444444444444444444444444444444
// 132:33333333443333333333333344444444444444444444444444444444ffffffff
// 133:33333333333333333333333344444444444444444444444444444444ffffffff
// 134:3333333333333333333333333333333344444444444444444444444444444444
// 135:3333333333333333333333333333333344444444444444444444444444444fff
// 136:33333333443333333333333344444444444444444444444444444444ffffffff
// 137:33333333333333333333333344444444444444444444444444444444ffffffff
// 138:3333333333333333333333334444444444444444444444444444444444444444
// 139:33333333333333333333333344444444444444444444444444444fff44444444
// 140:333333333333333333444444444444444444444444444444ffffffff44444444
// 141:333333333333333333333333444444444444444444444fffffffffff44444444
// 142:33333333333333333444444444444444444444ffffffffffffffffff44444444
// 143:33333333333333ff44444fffffffffffffffffffffffffffffffffff4fffffff
// 144:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 145:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 146:fffff444ffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 147:4444444444444444fffff444ffffffffffffffffffffffffffffffffffffffff
// 148:444444444444444444444444ffffffffffffffffffffffffffffffffffffffff
// 149:444444444444444444444444fff44444ffffffffffffffffffffffffffffffff
// 150:444444444444444444444444ffffffffffffffffffffffffffffffffffffffff
// 151:444444444444444444444444fff44444ffffffffffffffffffffffffffffffff
// 152:444444444444444444444444ffffffffffffffffffffffffffffffffffffffff
// 153:444444444444444444444444fff44444ffffffffffffffffffffffffffffffff
// 154:444444444f44444444ffffff44ffffffffffffffffffffffffffffffffffffff
// 155:4444444444444444fff44444ffffffffffffffffffffffffffffffffffffffff
// 156:44ffffffffffffff44444444ffffffffffffffffffffffffffffffffffffffff
// 157:ffffffffffffffff444fffffffffffffffffffffffffffffffffffffffffffff
// 158:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 159:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// 160:fffffffffffffffffffffffffffffffffffffffffffff000ffff0cccfff0cccc
// 161:ffffffffffffffffffffffffffffffffffffffff00000000cccccccccccccccc
// 162:ffffffffffffffffffffffffffffffffffffffff00000000cccccccccccccccc
// 163:ffffffffffffffffffffffffffffffffffffffff00000000ccccccccccccccdc
// 164:ffffffffffffffffffffffffffffffffffffffff00000000cccccccccccccccc
// 165:ffffffffffffffffffffffffffffffffffffffff000fffffccc0ffffcccc0fff
// 166:cccccccccccccccccccccccccddcccdcccdccddcccddcddcccddcdcccccdcccc
// 167:ccccccc0ccccccc0ccccccc0ccccdcc0ccccccc0ccccccc0ccccccc0ccccccc0
// 176:fff0ccccff0cccccff0cccccf0cccdccf0ccccccf0cccccc0ccccccc0ccccccc
// 177:cccdcccccccccccccccccccccccccccccccccccccccccccccccdcccccccccccc
// 178:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// 179:cdcccddccddccdccccdccccccccccccccccccccccccccccccccccccccccccccc
// 180:ccccccccccccccccccccccccccccccccccccccccccccdccccccccccccccccccc
// 181:dccc0fffccccc0ffccccc0ffcccccc0fcccccc0fcccccc0fccccccc0ccccccc0
// 182:ccccccccccccccccccccccccccccccccccccccccccccdccccccccccccccccccc
// 183:dcccccc0ccccccc0ccccccc0cccdccc0ccccccc0ccccccc0ccccccc0ccccccc0
// 192:fffffffffffffffffffffffffffffffffffffffffffff000ffff0666fff06666
// 193:ffffffffffffffffffffffffffffffffffffffff000000006666666666666666
// 194:ffffffffffffffffffffffffffffffffffffffff000000006666666666666666
// 195:ffffffffffffffffffffffffffffffffffffffff000000006666666666666666
// 196:ffffffffffffffffffffffffffffffffffffffff000000006666666666666666
// 197:ffffffffffffffffffffffffffffffffffffffff000fffff6660ffff66660fff
// 198:6666666666666666666666666666667666766776667767766677676666676666
// 199:6666666066666660666666606666766066666660666666606666666066666660
// 208:fff06666ff066666ff066663f0666663f0666666f06666660666666606666666
// 209:6666666633666666443666664436666633666666666666666666666666666666
// 210:6666666666666666667766666667766766666677666666766666666666666666
// 211:6776666677666666666666666666666666666666666666666666666666666666
// 212:6667766666667666666666666666666766666667666666666666666666666666
// 213:66660fff666660ff666660ff7666660f6666660f6666660f6666666066666660
// 214:6666666666666663666666636666666666666666666676666666666666666666
// 215:3366666044366660443666603366666066666660666666606666666066666660
// 224:fffffffffffffffffffffffffffffffffffffffffffff000ffff0444fff04444
// 225:ffffffffffffffffffffffffffffffffffffffff000000004444444444444444
// 226:ffffffffffffffffffffffffffffffffffffffff000000004444444444444444
// 227:ffffffffffffffffffffffffffffffffffffffff000000004444444444444444
// 228:ffffffffffffffffffffffffffffffffffffffff000000004444444444444444
// 229:ffffffffffffffffffffffffffffffffffffffff000fffff4440ffff44440fff
// 230:4444444444444444444444444444444444443344444433444444444444424444
// 231:4444444044444440424444404444444044444440444444404444444044444440
// 240:fff04443ff044444ff044444f0444444f0444444f04444440444444404444444
// 241:4444344434434444322344443333444443344444444444444444444444444444
// 242:4424444444444444444444444444444444444444444424444444444444444444
// 243:4444442444444444244444444444444444444444444442444444444444444444
// 244:4444424444344444444334334444343444444444444444444444444444444444
// 245:44440fff344440ff444440ff4444440f4444440f4444440f4424444044444440
// 246:4444444444444444444444444444444444444444444443344444433444444444
// 247:4444244044444440444444404444444024444440444444404444444044444440
// </SPRITES>

// <MAP>
// 000:e0f0e0f0e0f0e0f0e0f0e0f00a1a2a3a2a3aa8b82a3a4a5ae0f0e0f0e0f0e0f0e0f0c4d4e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcccecfcdccdddccecfcdc6e7e8e9eaebeccdccedecc6e7eaebedcccdce0f0e0e0f0e0f0f0e0e0f0e0f0e0f0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 001:e1f1e1f1e1f1e1f1e1f1e1f10b1b2b3b2b3ba9b92b3b4b5be1f1e1f1e1f1e1f1e1f1c5d5e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cdddcdedfdddedfdcdedfddd6f7f8f9fafbfcdddcfdfcd6f7fafbfddcddde1f1e1e1f1e1f1f1e1e1f1e1f1e1f1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 002:e0f0e0f0e0f0c4d4e0f0e0f00c1c2c3c2c3caaba2c3c4c5ce0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcc8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8ccdce0f0e0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0f0e0f0e0f0e0f0e0f0
// 003:e1f1e1f1e1f1c5d5e1f1e1f10d1d2d3d2d3dabbb2d3d4d5de1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cdddc9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9cddde1e0f0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1c4d4f1e1f1e1f1e1f1
// 004:f0f0e0f0e0f0e0f0e0f0e0f00e1e2e3e2e3eacbc2e3e4e5ee0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcc8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8cadac8d8c8d8ccdce0e1f1e1f1e1e0f0f1f0e1f1e1f1e1f1e1f1e1f1e1c5d5e0f0e0f0e0f0e0
// 005:f1f1e1f1e1081808180808180f1f2f3f2f3fadbd2f3f4f5f0818e1f1e1f1e1f1e1f1e1f1e1f1e1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cdddc9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9cbdbc9d9c9d9cddde1e0f0e0e0f0e1f1f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e1f1e1
// 006:f1f0e0081809190818090919384858081828380818283808091918f0e0f0e0f0e0f0e0f0e0f0e0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcc8d8c8d8cadac8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8eefee0e1e0f0e0f0e0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c4d4
// 007:f0f1e10919091909194959293949590919293909192939091909190818080818e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cdddc9d9c9d9cbdbc9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9efffe1f1e1f1e1f1e1f1e1f1e1f1f0e0f0e0f0f0e0f0e0f0e0f0e0f0e0f0c5d5
// 008:f1f0e0081828384858081808180818081828384858081828384858091909091918f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0cedec8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8ccdce0f0e0f0e0f0e0e1f1e1f1e1f1e1f1e1f1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 009:e1f1e109192939081818190919e6f6091929394959091929394959091909190919f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cfdfc9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9cddde1f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 010:e0f0e02b3ba9b92b3b19180818e7f7283848081818081848580818081848580818f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcc8d8c8d8c8d8c8d8c8d8c8d8c8d8eafac8d8eafac8d8eafac8d8ccdce0f0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 011:f0f1e12c3caaba2d3d091909190919293949091919e6f649590919091949590919f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cdddc9d9c9d9c9d9c9d9c9d9c9d9c9d9ebfbc9d9ebfbc9d9ebfbc9d9cddde1f1e0f0e0f0e0f0e0f0e0f0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0
// 012:d4f0e02e3eabbb2e3e081828384858081828384858e7f728384858081828384858f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcc8d8c8d8c8d8c8d8cadac8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8ccdce0e0f0e0f0e0f0e0f0e0f0e0f0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1c4
// 013:d5f1e1aabaaaba2c3c091929394959091929394959091929394959091929394959f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1cdddc9d9c9d9c9d9c9d9cbdbc9d9c9d9c9d9c9d9c9d9c9d9c9d9c9d9ccdce1e1f1e1f1e1f1e1f1e1f1e1f1d9e0f0e0f0e0f0e0f0e0f0f0e0f0e0f0c5
// 014:f1f0e0abbbabbb2d3d0a1a2a3a2a3a2a3a2a3a2a3a2a3a2a3a2a3a2a3aa8b84a5af0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0ccdcc8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8c8d8cddde0f0e0f0e0f0e0f0e0f0e0f0e0f0e1f1e1f1e1f1e1f1e1f1f1e1f1e1f1e1
// 015:e0f0e1acbc2e3e2e3e0b1b2b3b2b3b2b3b2b3b2b3b2b3b2b3b2b3b2b3ba9b94b5bf1e1f1e1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1ccdcccdccceefedcccdcccdcccdcccdcccdcccdcccdcccdcccdcccdcccdce0f0e1f1e1f1e1f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 016:e1f1e0adbd2f3fadbd0e1e3e2e3e2e3e2e3e2e3e2e3e3e2e3e2e3e2e3eacbc4e5ef0e0f0e0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0cdddcdddcdefffddcdddcdddcdddcdddcdddcdddcdddcdddcdddcdddcddde1f1f0f1f0e0f0e0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 017:f0f1e10818081808180f1f3fadbd2f3f2f3f2f3f2f3fadbd3f2f3f2f3fadbd4f5ff1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1e0f0e0f0e1f1e1f1e1f1e1f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0
// 018:08180818181808180818180818081808e6f6180848581808180818081808485818f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c4d4f1e1f1e1f1e1f1e1
// 019:09190919485809190919190919091909e7f7190949591909190919091909495919f1e1f1e1f1e1f1e1f1e1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1c5d5e1f1e1f1e1f1e1f1
// 020:08180818495908180818e6f628382838e6f6e6f608182838e6f60818081808080818e0f0e0f0e0f0e0f0e0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 021:09e6f619092838190919e7f729392939e7f7e7f709192939e7f70919091909090919e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e108
// 022:19e7f7181829394858081828380818e6f6e6f6e6f608182838081808180818e6f618e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e009
// 023:181848581909194959091929390919e7f7e7f7e7f708182838091909485819e7f719e1f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e108
// 024:1a2a49593aa8b82a3a2a3a1848580818e6f6e6f60818192939091908495908180818e0f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e00a
// 025:1b2b3b2b3ba9b92b3b2b3b1949590919e7f7e7f7e6f6082a3a2a3a2a3aa8b82a4a5ae1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c4d4f1e1f1e10b
// 026:1c2d3d2d3daaba2d3d2c3c081818e6f60818e6f6e7f7092b3b2b3b2b3ba9b92b4b5be0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0c5d5f0e0f0e00c
// 027:1d2e3e2e3eabbb2e3e2d3d08e6f6e7f7e6f6e7f70808182f3f2f3f2f3fadbd3f4f5fe1f1e1f1e1f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e10d
// 028:1c2d3d2d3daabaaaba2d3d0ae7f73a2ae7f73a2aa8b85a081808180818081808180818f0e0f0e0f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e00c
// 029:1d2e3e2e3eabbbabbb2e3e0b1b2b3b2b3b2b3b2ba9b95b091948580919091909283819f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e10d
// 030:1eacbc2e3eacbcacbc2e3e0c1c2d3d2d3d2d3d2daaba5c08184959081808180829390818e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e00e
// 031:1fadbd2f3fadbdadbd2f3f0d1d2e3e2e3e2e3e2eabbb5d0919e6f64858091909e6f65819e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c4d4f1e1f1e1f1e1f1e1f1e10f
// 032:18081808180818081808180e1e2eacbc3e2e3e2e3e4e5e0818e7f74959081808e7f7590818f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0c5d5f0e0f0e0f0e0f0e0f0e008
// 033:19283848580919092838190f1f2fadbd3f2f3f2f3f4f5f0919091909190919091909190919f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e109
// 034:082939495918081829390818e6f6081808e6f6381828384858081828384858081828384858f0e0f0c4d4e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f00818
// 035:f619091909190919e6f60919e7f709e6f6e7f7391929394959091929394959081829394959f1e1f1c5d5e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f109e6
// 036:f718081818283808e7f71808180818e7f70818081808180818081808180818e6f608180818f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f008e7
// 037:091909191929390919e6f6e6f6091909190919e6f609190919091908180818e7f708180919f1e1f1e1f1e1f1e1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f10919
// 038:2a3aa8b82a3a2a3a2ae7f7e7f73a2a3a2a3a2ae7f718283848580818190919091909194858f0e0f0e0f0e0f0e0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0c4d4f0e0f00a1a
// 039:2b3ba9b92b3b2b3b2b3b2b3b2b3b2b3b2b3b2b3b0919293949590818180818283848584959f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c5d5f1e1f10b1b
// 040:2e3eacbc2e3e2e3e2e3e2e2d3d3e2e3e2e3e2e3e0a1aa8b808180919a8b8a8b83949594a5af0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0c4d4f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f00e1e
// 041:2f3fadbd2f3f2f3f2f3f2fadbd3f2f3f2f3f2f3f0b1ba9b92b3b2b3ba9b9a9b92b3b2b4b5bf1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c5d5f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f10f1f
// 042:c6d6607060c6d6706070809070607060706060700c1caaba2c3c2c3caabaaaba2c3c2c4c5cf0e0f0c4d4e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f06070
// 043:c7d7617161c7d7716171819171617161716161710d1dabbb2d3d2d3dabbbabbb2d3d2d4d5df1e1f1c5d5e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f16171
// 044:d6607060c6d67060706070607060c6d6607060700e1e2e3e2e3e2e3eacbcacbc2e3e2e4e5ef0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e06070c6
// 045:d7618090c7d771c6d66171617161c7d7617161710f1f2f3f2f3f2f3fadbdadbd2f3f2f4f5ff1e1f1e1f1e1f1e1f1e1f1e1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1607071c7
// 046:70608191706070c7d76070607070607060607060706070c6d660c6d6706070607060c6d670f0e0f0e0f0e0f0e0f0e0f0e0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f061607060
// 047:71c6d6c6d6607060c6d670607070617161618090716171c7d761c7d7809071617161c7d76070e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1607060c6d6
// 048:70c7d7c7d760c6d6c7d77060c6d67060706081917060c6d67060c6d6819170c6d6c6d6a0b0716070e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0c4d4f0e0f0e0617160c7d7
// 049:716171617161c7d771617161c7d77161716160706070c7d77161c7d7716171c7d7c7d7a1b18090a0b0f1e1c4d4f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1c5d5f1e1f1e16070a0b061
// 050:607060706070607060a0b0607060706070c6d6c6d6607060706070607060c6d670607060708191a1b1f0e0c5d5f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0c4d4e0f0e0f0e0f0e0f0e0a0b0a1b170
// 051:617161716171617161a1b1617161716171c7d7c7d76171c6d66171617161c7d771617161716161a2b2f1e1f1e1f1e1f1607070f1e1f1e1f1e1f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1c5d5e1f1e1f1e1f1e1f1e1a1b1607071
// 052:8292829282928288989282926070706070607060706070c7d760c6d6c6d6c6d660c6d660706070a3b3f0e0f0e06070809071718090a0b0f0e0f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e06272928292
// 053:8393839383938389999383936070716171617161716160706070c7d7c7d7c7d760c7d761716171a4b4f1e1f1e16171819161718191a1b1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e16373938393
// 054:849484948494848a9a94849462728292829282928288989282928292829282928288988898a2b2a5b5f0e0f060708090a0b0c6d68090a0b0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e06474948494
// 055:85958595859585859595859563738393839383938389999383938393839383938389998999a3b3a6b6f1e1f161718191a1b1c7d78191a1b1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e16575958595
// 056:868c9c9686968696869686966474849484948494848a9a948494849484948494848a9a8a9aa4b4a7b7f0e0f062728898928292828898a2b2e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e06676968696
// 057:878d9d9787978797879787976575859585958595858b9b958595859585958595858b9b8b9ba5b56070c6d66063738999938393838999a3b3e1f1e1f1e1f1e1f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e16777978797
// 058:7060706070607060706070706676869686968696869686968696869686968696868c9c8c9ca6b66171c7d76164748a9a948494848a9aa4b4e0f0e0f0e0f0e0f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e06070607060
// 059:7161716171617161716171716777879787978797879787978797879787978797878d9d8d9da7b7607060706065758b9b958595858b9ba5b5e1f1e1f1c4d4e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1617161c6d6
// 060:7060706070607060706070707060706070607060706070607060706070c6d66070607060706070617161716166768c9c968696868c9ca6b6e0f0e0f0c5d5e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e06070607060c7d7
// 061:716171617161c6d6716171717161716171617161716171617161716171c7d7c6d6617161716171607060706067778d9d978797878d9da7b7e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e161716171617161
// 062:706070607060c7d77060707070607060706070c6d660706070607060706070c7d7607060706070c6d661716171617161c6d671617161716070f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e060706070607060
// 063:71617161716171617161717171617161716171c7d761716171617161716171c6d6c6d661c6d671c7d760c6d67060c6d6c7d770607060706171f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e161716171c6d661
// 064:70607060706070607060707070607060706070607060706070607060c6d670c7d7c7d760c7d7c6d6c6d6c7d7c6d6c7d7716171617161716070f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e060706070c7d760
// 065:7161716171c6d6617161717171c6d661716171617161716171617161c7d7716171617161c6d6c7d7c7d7c6d6c7d7c6d6716171607060706171f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e161716171617161
// 066:7060706070c7d7607060706070c7d7607060706070607060706070607060706070607060c7d770607060c7d77060c7d7706070617161c6d66070e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e060706070607060
// 067:716171617161716171617161716171617161716171617161716171617161716171617161716171617161716171617161716171617161c7d76171e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e161716171617161
// 068:92829282928292829282829288989282928292829282928292607060706070607060706070607060706070607060706070607060706070606070e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e062728292829282
// 069:93839383938393839383839389999383938393839383938393617161716171617161716171617161716171617161716171617161716171616171e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e163738393839383
// 070:948494849484948494848a9a8a9a84948494948494849484946070607060c6d6706070607060706070606070607060706070606070607070606070f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e064748494849484
// 071:958595859585958595858b9b8b9b85958595958595859585956171617161c7d7716171617161716171616171617161716171616171617171616171f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e165758595859585
// 072:94849484948494848a9a8a9a8c9c948494848a9a94849484946272829282928292829288988292928292828292829282889892829282889892a2b2f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e064748494849484
// 073:95859585958595858b9b8b9b8c9c958595858b9b95859585956373839383938393839389998393938393838393839383899993839383899993a3b3f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e165758595859585
// 074:86968696869686968c9c8c9c8696869686968c9c869686869666769686968696869686968696869686969686968696868a9a96869686968696a6b6f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e066768696968696
// 075:87978797879787978d9d8d9d8797879787978d9d879787879766768696869686968696869686968696868c9c968696868c9c96869686968686a6b6f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e167778797978797
// 076:1020304050101020304050100010e4f40010e4f4203040501067778797879787978797879787978797878d9d978797878d9d97879787978787a7b7f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e000100010001000
// 077:1121314151111121314151110111e5f50111e5f5213141511100100010001020304050100010001000e4f410203040501010001000102030405010f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e101110111011101
// 078:10001000001010001000001000100010e4f40010001000001001110111011121314151110111011101e5f511213141511100101101112131415111f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e000100010001000
// 079:11011101011111011101011101110111e5f5e4f42030e4f41100e4f4100010001000001000100010001000e4f4100000100111e4f4100010000010f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e101110111011101
// 080:100000100020300000100010001020304050e5f52131e5f51000e5f51000102030203010e4f40111011101e5f5110101111101e5f5e4f411010111f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e000102030405000
// 081:110101110121310101e4f411011121314151e4f401011101203011011101112131213111e5f5203040500010e4f410001010405000e5f5e4f40010f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e101112131415101
// 082:687822322232223222e5f532223222322232e5f5223242522131100010001000100000100111213141510111e5f5e4f4e4f44151011101e5f5e4f4f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e002122232223222
// 083:69792333233323332333233323332333233323332333435311011101e4f411011101011111001000100010001000e5f5e5f50010001020e4f4e5f5f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e103132333233323
// 084:6a7a2434243424342434243424342434243424342434445400100010e5f500102030405010001000100010e4f4e4f410e4f4e4f4001020e5f5e4f4f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e004142434243424
// 085:6b7b25352535253525352535253525352535253525354555011101110111011121314151e4f41101110111e5f5e5f511e5f5e5f5011121e4f4e5f5f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e104142535253525
// 086:6a7a24342434243424342434243424342434243424344555001000100010001000100000e5f5100010001000e4f4e4f400100010001000e5f50010f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e005152434243424
// 087:6b7b253525352535253525352535253525352535253544540111011101110111011101011101110111011101e5f5e5f501203010101101e4f40111f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e104142535253525
// 088:6a7a7a3424342434243424342434243424342434243445550010203040500010000010001000102030405000100000100021311111e4f4e5f50010f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e005152434243424
// 089:6a7a7b3525352535253525352535253525352535253544540111213141510111010111016878112131415101110101110111686878e5f501114252f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e105152535256a7a
// 090:6b7b7c3424342434243424342434243424342434243445552333233323333323332333236979333323233323332333336979696979332333334353f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e004142434246b7b
// 091:6b7b253525352535253525352535253525352535253544542636263626363626362636266c7c363626263626362636366c7c6c7c26362636364656f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e105152535256a7a
// 092:6a7a243424342434243424342434243424342434243445552737273727373727372737276d7d373727273727372737376d7d6d7d27372737374757f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e00414246a7a6b7b
// 093:6b7b253525352535253525352535253525352535253544540111011100100010001000100010011101110010001001110111001000100010001000f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e10515256b7b6a7a
// 094:343424342434243424342434243424342434243424344555001000100100100010e4f40010000010110120300111010111010111011101e4f4011101e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e00414246c7c6b7b
// 095:353525352535253525352535253525352535253525354555011140500101110111e5f50111010111001021310010001000405010001000e5f501110101f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e10515256c7c6c7c
// 096:36362636263626362636263626362636263626362636465600104151001000011101111000100010011101110111011101415111011101110111011101f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e00616266c7c6c7c
// 097:37372737273727372737273727372737273727372737475701110111011101405011011101110111110111011101110111011101110111011101110111f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e10717276d7d6d7d
// 098:e4f40111011101011101110111010111203001110101110010001001110111415101112030000010001000100010e4f400010010001000100001116070f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f01101203001110101
// 099:e5f5010111011101011101110100100021310110000111001000e4f4110111011101112131100010011101110111e5f501110111011101110111016070f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f10011213111011101
// 100:100001001000e4f4100001110101110111011111010200100010e5f50010001000101000000001521101110101110101110111010111011101016070e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f00100100010001000
// 101:110111011101e5f5110111011160706070607060700301001011100010001000203010100101115310001060706070001000100010000111016070f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f16070116070607001
// 102:60706070607060707060706070607070e0f0e0f0e00602011100100010001010213100100111525611016070607070607001110111016070607070f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e060706060706070
// 103:e1f1e1f1e1f1e160706070f1e1f1e1f1e1f1e1f1e107030212011101110111116878687842525357706070706070607060706070607060706070e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 104:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0e00403132333233323332369796979435354e0e0f0e0f0e0f0e0f0e0f0607060706070e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 105:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1e1060414243424342434246a7a6a7a445456e1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 106:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0070515253525352535256b7b6b7b455557f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 107:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e00616263626362636266c7c6c7c4656e0f0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 108:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e10717273727372737276d7d6d7d4757e1f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 109:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f0e1606070012030110111011101606070e0f0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 110:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e060702131001000405060606070e1f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 111:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e16070607001110141516070e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 112:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0606070607060606070e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 113:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1607060706060f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 114:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 115:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 116:e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 117:e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 118:e0f0e0f0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 119:e1f1e1e0f0e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e0f0e1f1e1f1e1f1e1f1e1f1e1f1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 120:f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0f1e0f0e0f0e1f1e0f0e0f0f1f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0e0f0e0f0e0f0e0
// 121:f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1e1f1e1f1e0f0e1
// 122:f2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2f2e2f2e2f2e3f3e2f2f2e2f2f2e2f2e2f2e2f2e2f2e2e0f0e1f1e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e2f2
// 123:f3f3e3f3e3f3e3f3e3f3e3f3e3f3e3f3e3f3f3e3f3e3f3e3f3e3f3f3e3f3f3e3f3e3f3e3f3e3f3e3e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e3f3
// 124:f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2f2e2f2e2f2c0d0e2f2e2e2f2e2f2e2f2e2e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e2f2
// 125:f3e3f3e3f3e3f3e3f3e3f3e3c2d2f3e3f3e3f3e3f3e3f3f3e3f3e3f3c1d1e3f3e3e3f3e3f3e3f3e3e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e3f3
// 126:f2e2f2e2f2e2f2e2f2e2f2f2c3d3e2f2e2f2e2f2e2f2e2f2f2e2f2e2f2e2f2e2f2e2e2e2f2e2f2e2e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e2f2
// 127:f3e3f3e3f3e3f3e3f3e3f3f3e3f3e3f3e3c0d0f3e3f3e3f3f3e3f3e3f3e3f3e3f3e3e3e3f3e3f3e3e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e3f3
// 128:f2e2f2e2f2e2f2e2f2e2f2f2e2f2e2f2e2c1d1f2e2f2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2f2e2e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e2f2
// 129:f3e3f3e3f3e3f3e3f3e3f3f3e3f3e3f3e3f3e3f3e3f3f3e3f3e3f3e3f3e3f3e3f3e3f3e3f3e3f3e3e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e3f3
// 130:e0f0e0f0e0f0e0f0e0f0e0e0f0e0f0f0e0f0e0f0e0f0e0f0f0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 131:e1f1e1f1e1f1e1f1c4d4e1e0f0e1f1f1e1f1e1f1e1f1e1e0f0f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e0f0e1f1e1f1
// 132:e0f0e0f0e0f0e0f0c5d5e0e1f138485828384858190919e1f1f0e0f0c4d4e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e1f1e0f0e0f0
// 133:e1f1e1f1e1f1e1f1e1f1e1f1293949592939495909190818e1f1e1f1c5d5e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// 134:e0f0e0f0e0f0e0f0e0f0e0f00818e6f60818081828380818e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0e0f0
// 135:e1f1e1f1e1f1e1f1e1f1e1f10919e7f70919091929394959e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1ccdce1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1e1f1
// </MAP>

// <WAVES>
// 000:0000000fffffffff00000000ffffffff
// 001:12356789abcdeeeeeedcba9876543100
// 002:f335dfffeddddbd0c04f2e6543211c70
// 004:134567899abccdeeeedcaa8766543210
// </WAVES>

// <SFX>
// 000:0100010011003100310041005100610071007100810081009100a100b100b100c100c100d100e100e100f100f100f100f100f100f100f100f100f10047b000000000
// 001:01000100110011001100210031003100410041005100610061008100810081008100910081009100a100a100b100b100a100c100c100c100d100d100214000000000
// 002:040004000400040004000400040004000400040004000400040004000400040004000400040004000400040004000400040004000400040004000400000400000000
// 056:e305c305c304b304a304930383038303830393039302a302a302a301b301b301c301c301c301d301d301d300d300e300e300e300e300e300f300f300c0b000000000
// 057:f30bd30cb30c930d930d930d830e8300830083009300a300a300b301b301b301c301c301c301d301d301e301e301e301e301e301e301e301f301f301d04000000000
// 058:9300a300c300c300d300d300d300c400a300a300930093009300a300a300b300c300d300d300d300e300e300e300f300f300f300f300f300f300f300414000000000
// 059:f300f300f300f300f300e300e300d300c300b300b300a300a3009300930093009300a300a300b300c300c300d300d300e300e300e300f300f300f30041b000000000
// 060:e300d300b30093006300a300b300c300d300d300e300e300e300e300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300414000000000
// 061:010fa10d010ca10d0100a1020102a1030103a1030103a1020102a10f010fa1000100a1000100a1000100a1000100a1000100a1000100a1000100a100604000de000f
// 062:9f087f095f094f0b3f0c2f0d2f0e1f0e0f0e0f0f0f0f0f000f000f000f000f000f011f012f022f032f033f053f053f063f042f031f020f020f010f0155b000ff00ff
// 063:d10081004100010001000100010001000100010001000100010011001100210021003100410051005100610061007100710081008100810091009100704000000000
// </SFX>

// <PATTERNS>
// 000:0249f1f03cffe008ff1008f1f008ffe008ff1008f1f008ffe008ff1008f10000000000000000001008f10000000000007329df0000000000000008d11008d10000000000000000000000000000000008f10008d10008f10008f10008d10000000008f10008f1000000000000000000000000000000000000000000f008ffe008ff1008f1000000f008ffe008ff1008f10000000000000000000000000008e1000000000000000000000000000000000000000000000000000000000000000000
// 001:000000000000000000000000000000000000053100002400f008ffd008fff008ffd429fff008ffd008fff219ffd008ffa008ffc008ffa008ffc008ffa008ffc008ffa008ff0429f1d008fdf008fdd008fdf008fdd008fdf008fd1008f10000000000000000000000000000000000000000000000000000000000000000000000007329df0000000000000000001008d10000007219df0000000000001008d1000000000000000000000000000000000000000000000000000000000000000000
// 002:000000024100002400000000f008ffe008ff1008f1f008ffe008ff1008f10000000000000000007329df0000000000001008d10008d10000000000000000000000000000000000000000000000000000000000000000000000001008d17219df0000000000000000001008d1000000000000000000000000000000f349ffe008fff008ffe249ffd008ffb239ffd008ffb249ff9008ffb008ff9259ffb008ff1008f1000000000000000000000000000000000000000000000000000000000000
// 009:800004000000000000000000f00004000000000000000000f00006000000000000000000800006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f00004000000000000000000800004000000000000000000f00004000000000000000000f00006000000000000000000800006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 010:700004000000000000000000f00004000000000000000000d00006000000000000000000700006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f00004000000000000000000700004000000000000000000f00004000000000000000000d00006000000000000000000700006000000000000000000000000000000000000000000f00004000000000000000000500006000000000000000000700006000000000000000000
// 011:800004000000000000000000f00004000000000000000000f00006000000000000000000800006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f00004000000000000000000700004000000000000000000f00004000000000000000000f00006000000000000000000700006000000000000000000000000000000000000000000000000000000000000000000d00004000000000000000000700004000000000000000000
// 012:500004000000000000000000c00004000000000000000000c00006000000000000000000700006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500004000000000000000000c00004000000000000000000c00006000000000000000000700006000000000000000000000000000000000000000000100000000000000000000000c00004000000000000000000400006000000000000000000
// 019:f45efb0000000008f10000000008f10000000000000000008008fb000000000000000000a008fb0000000000000000000000000000000008f10000004008fb0000000000000000000008f1000000000000000000f008f90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001008f10000000000000000000008f10000000000000000007008fb0000000000000000008008fb000000000000000000a008fb000000000000000000
// 020:c45efb0000000000000000000008f1000000000000000000a008fb0000000008f1000000c008fb0000000000000000000000000000000000000008f1f008fb0000000000000000000008f1000000000000000000a008fb0000000000000000000008f10000000000000000000008f10000000000000000008008fb000000000000000000a008fb0000000000000000000008f1000000000000000000c008fb0000000000000000001008f10000000000000000008008fb000000000000000000
// 021:0456000000000000000000000000000000000000000000000000000000000000000000001008f10000000008f10000000000000000000000000000007008f90000000000000000008008f9000000000000000000a008f9000000000000000000000000000000000000000000c008f90000000000000000000008f1000000000000000000f008f90000000000000000000008f1000000000000000000a008f90000000000000000000008f10008f10000000008f1c008f90008f1000000000000
// 022:045ef10000000008f10000000008f10000000000000000000008f10000000000000000001008f10000000000000000000000000000000008f10000004008f90000000000000000000008f1000000000000000000f008f70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001008f10000000000000000000008f10000000000000000000008f10000000000000000000008f1000000000000000000a008f9000000000000000000
// 023:045ef10000000008f10000000008f10000000000000000000008f10000000000000000001008f10000000000000000000000000000000008f10000004008f90000000000000000000008f1000000000000000000f008f70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001008f10000000000000000000008f10000000000000000000008f10000000000000000000008f10000000000000000000008f1000000000000000000
// 029:f669d91008d1f008d91008d1f008d91008d1f008d91008d1f008d9100000f008d91000004008db1000006008db000000f008d91008d1f008d9100000f008d9100000f008d91008d1f008db100000f008d91000004008db0008d16008db1008d1f008d91008d1f008d91008d1f008db1008d1f008d91008d1d008db1008d1f008d91008d14008db1008d16008db1008d1f008d91008d1f008d91008d1f008d91008d1f008d9100000f008d91008d1f008d91008d1f008d91008d1d008d9100000
// 030:f669f90008f10008f11008f10008d10008d10008d10008d1f008f91008f1d00ef91008f14008d91000006008d9000000f47efb0008f10008d10008f10008d11008f10008d10008d1f008fb1008f1d00efb1000004008db0008d16008db1008d1f008d71008d1f008d71008d1f008d71008d1f008d71008d1f008fb1008d1d008fb1008d14008db1008d16008db1008d10008d10008d10008d10008d10008d10008d10008d1000000f008fb1008f1d008fb1008f14008db1008d16008db100000
// 031:f449dd0000000008f10000000008f1000000000000000000855efd000000000000000000a00edd0000000000000000000000000000000008f10000004008dd0000000000000000000008f1000000000000000000f008fb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001008f10000000000000000000008f10000000000000000007008db0000000000000000008008db000000000000000000a008db0000000000000008d1
// 032:8669db0000000000000000000000000000000000000000001008d10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008d1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 039:800004000000000000000000800014000000000010000000800014000000400004000000100000000000000000000000800014000000000000000000800004000000000000000000800014000000400004000000000000000000000000000000800004000000000000000000800014000000000000000000800014000000400004000000100000000000000000000000800004000000000000000000800014000000000000000000800014000000400004000000000010000000000000000000
// 040:8000040000000000000000000008d10000001008d1000000800014000000400004000000100000000000000000000000800014000000000000000000f00004000000000000000000f00016000000800006000000100000000000000000000000800014000000000000000000800014000000000000000000800014000000400004000000100000000000000000000000800004000000000000000000f00014000000000000000000f00016000000800006000000000010000000000000000000
// 041:7000040000000000000000000008d10000001008d1000000700014000000f00002000000100000000000000000000000700014000000000000000000f00004000000000000000000f00016000000700006000000100000000000000000000000700014000000000000000000700014000000000000000000700014000000f00002000000100000000000000000000000700004000000000000000000f00014000000000000000000f00016000000700006000000000010000000000000000000
// 048:0000000000000000000000000000000008d10008c10008c18999cd0008c10008c10000000000000000000000000000000000000000000000000000000008c10000000000000000008999cd0000000000000000000008c10000000000000000000000000000000000000000000000000000000000000000008008cd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008008cd000000000000000000000000000000000000000000
// 049:0000000000000000000000000000000008d10008c10008c18999cd0008c10008c10000000000000008c1f559cb0000000000000000000000000000000008c10000000000000000008999cd0000000000000000000008c10000000000000000000000000000000000000000000000000000000000000000008999cd000000000000000000000000000000f559cb0000000000000000000000000000000000000008c1000000000000f999cb0000008229cd000000c008cd000000f008cf000000
// 057:4019ef0111000211000229f1000000000000000000000000000000000000023100000000033100000000000000000000000000000000000000000000032100000000000000033100000000000000000000000000000000000000000000000000000000000000000000000000023100000000000000022100000000000000000000000000000000000000000000000000000000000000021100000000000000000000000000000000011100000000000000000000000000000000000000000000
// 058:4119ef0121000131000141000241000341000441000000000000000000000000000000000451000000000000000000000000000000000000000000000000000000000000000000000341000000000000000000000331000000000000000000000000000000000000000000000341000000000000000000000000000000000000000000000331000000000000000000000231000000000000000000000221000000000000000000000221000000000000000000000211000221000111000008f1
// 059:4119ef0021000031000141000241000341000441000541000641000000000000000000000551000000000000000000000000000000000000000000000000000000000000000000000561000000000000000000000551000000000000000000000000000000000000000000000451000000000000000000000000000000000000000000000441000000000000000000000341000000000000000000000331000000000000000000000331000331000331000321000311000301000201000119f1
// </PATTERNS>

// <TRACKS>
// 000:1000009300002000003000009300009300003000009300001000003000000000000000000000000000000000000000000000ef
// 001:08e00024e00018e0000ce00034e0002ce00008e00004e0000000000000000000000000000000000000000000000000000000ef
// 002:08e0000ce00004e00000f00008e00004e0000000000000000000000000000000000000000000000000000000000000000000ff
// 006:00a130e1a130f5a13012a23002a1300aa13016a230000000000000000000000000000000000000000000000000000000f000ff
// 007:c35a00005b00b75c00085d00af5a00b36b00000000000000000000000000000000000000000000000000000000000000000000
// </TRACKS>

// <FLAGS>
// 000:00000000000000000000000010101010000000000000000000000000101010100000000000000000000000001010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010100000000000000000000000000000000000000000000020204040606000000000000000000000202040406060000008081010101010102020404060600000080810101010101020204040606010101414101010101010202040406060101000001010101010101010101010100000000010101010101010101010101000000000
// </FLAGS>

// <PALETTE>
// 000:1a1c2c5d275db13e53ef7d57ffcd75a7f07038b76425717929366f3b5dc941a6f673eff7f4f4f494b0c2566c86333c57
// </PALETTE>

