//CoronaBusterScene
import Phaser from 'phaser'
import FallingObject from '../ui/FallingObject'
import Laser from '../ui/Laser'
import ScoreLabel from '../ui/ScoreLabel'
import LifeLabel from '../ui/LifeLabel'
export default class CoronaBusterScene extends Phaser.Scene {
    constructor() {
        super('corona-buster-scene')

    }

    init() { //initialization of all the variables that are going to be use in this game
        this.clouds = undefined //it can hold any value, includes string, numbers and etc
        this.nav_left = false //navigate to the left
        this.nav_right = false //navigate to the right
        this.shoot = false //for shooting
        this.player = undefined
        this.speed = 100
        this.enemies = undefined
        this.enemySpeed = 60
        this.lasers = undefined
        this.lastFired = 0
        this.scoreLabel = undefined
        this.lifeLabel = undefined
    }

    preload() //load all the assets into the code
    {
        this.load.image('background', 'images/bg_layer1.png')
        this.load.image('cloud', 'images/cloud.png')
        this.load.image('left-btn', 'images/left-btn.png')
        this.load.image('right-btn', 'images/right-btn.png')
        this.load.image('shoot-btn', 'images/shoot-btn.png')
        this.load.spritesheet('player', 'images/ship.png',
            { frameWidth: 66, frameHeight: 66 }
        )
        this.load.image('enemy', 'images/enemy.png')
        this.load.spritesheet('laser', 'images/laser-bolts.png',
            { frameWidth: 16, frameHeight: 32, startFrame: 16, endFrame: 32 }
        )
    }

    create() //define the undefined objects stated in init
    {
        const gameWidth = this.scale.width * 0.5
        const gameHeight = this.scale.height * 0.5
        this.add.image(gameWidth, gameHeight, 'background')

        this.clouds = this.physics.add.group({
            key: 'cloud',
            //amount of cloud
            repeat: 20
        })

        Phaser.Actions.RandomRectangle(this.clouds.getChildren(), this.physics.world.bounds);

        this.createButton()
        this.player = this.createPlayer()

        this.enemies = this.physics.add.group({
            classType: FallingObject,
            maxSize: 20,
            runChildUpdate: true
        })
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 3000),
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        })

        this.lasers = this.physics.add.group({
            classType: Laser,
            maxSize: 10,
            runChildUpdate: true
        })

        this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this)
        this.physics.add.overlap(this.player, this.enemies, this.decreaseLife, null, this)
        this.scoreLabel = this.createScoreLabel(16, 16, 0)
        this.lifeLabel = this.createLifeLabel(16, 43, 3)
    }

    update(time) //actions assigned to the objects -- actions under update will update something everytime
    {
        this.clouds.children.iterate((child) => {
            //direction of the clouds (moving on Y axis)
            child.setVelocityY(20)

            if (child.y > this.scale.height) {
                child.x = Phaser.Math.Between(10, 400)
                child.y = child.displayHeight * -1
            }
        })
        this.movePlayer(this.player, time)
    }

    createButton() //tell the buttons what they are going to do
    {
        this.input.addPointer(3)

        let shoot = this.add.image(320, 550, 'shoot-btn')
            .setInteractive().setDepth(1).setAlpha(0.8)
        let nav_left = this.add.image(50, 550, 'left-btn').setInteractive().setDepth(0.5).setAlpha(0.8)
        let nav_right = this.add.image(nav_left.x + nav_left.displayWidth + 20, 550, 'right-btn').setInteractive().setDepth(0.5).setAlpha(0.8)

        nav_left.on('pointerdown', () => { this.nav_left = true }, this)
        nav_left.on('pointerout', () => { this.nav_left = false }, this)
        nav_right.on('pointerdown', () => { this.nav_right = true }, this)
        nav_right.on('pointerout', () => { this.nav_right = false }, this)
        shoot.on('pointerdown', () => { this.shoot = true }, this)
        shoot.on('pointerout', () => { this.shoot = false }, this)
    }

    createPlayer() {
        const player = this.physics.add.sprite(200, 450, 'player')
        player.setCollideWorldBounds(true)

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'player', frame: 0 }],
        })

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 10
        })
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 10
        })

        return player
    }

    movePlayer(player, time) {
        if (this.nav_left) {
            this.player.setVelocityX(this.speed * -1)
            this.player.anims.play('left', true)
            this.player.setFlipX(false)
        } else if (this.nav_right) {
            this.player.setVelocityX(this.speed)
            this.player.anims.play('right', true)
            this.player.setFlipX(true)
        } else {
            this.player.setVelocityX(0)
            this.player.anims.play('turn')
        }

        if ((this.shoot) && time > this.lastFired) {
            const laser = this.lasers.get(0, 0, 'laser')
            if (laser) {
                laser.fire(this.player.x, this.player.y)
                this.lastFired = time + 150
            }
        }
    }

    spawnEnemy() {
        const config = {
            speed: this.enemySpeed,
            rotation: 0.06
        }

        // @ts-ignore
        const enemy = this.enemies.get(0, 0, 'enemy', config)

        const enemyWidth = enemy.displayWidth

        const positionX = Phaser.Math.Between(enemyWidth, this.scale.width - enemyWidth)

        if (enemy) {
            enemy.spawn(positionX)
        }
    }

    hitEnemy(laser, enemy) {
        laser.erase()
        enemy.die()

        this.scoreLabel.add(10)
        if (this.scoreLabel.getScore() % 100 == 0) {
            this.enemySpeed += 30
        }
    }

    createScoreLabel(x, y, score) {
        const style = { fontSize: '32px', fill: "#000" }
        const label = new ScoreLabel(this, x, y, score, style).setDepth(1)

        this.add.existing(label)

        return label
    }

    createLifeLabel(x, y, lifePlayer) {
        const style = { fontSize: '32px', fill: "#000" }
        const label = new LifeLabel(this, x, y, lifePlayer, style).setDepth(1)

        this.add.existing(label)

        return label
    }

    decreaseLife(player, enemy) {
        enemy.die()
        this.lifeLabel.subtract(1)

        if (this.lifeLabel.getLife() == 2) {
            player.setTint(0xff0000)
        } else if (this.lifeLabel.getLife() == 1) {
            player.setTint(0xff0000).setAlpha(0.2)
        } else if (this.lifeLabel.getLife() == 0) {
            this.scene.start('game-over-scene', { score: this.scoreLabel.getScore() })
        }
    }
}

//GameOverScene
import Phaser from 'phaser'
var replayButton
export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('game-over-scene')

    }

    init(data) {
        this.score = data.score
    }

    preload() //load all the assets into the code
    {
        this.load.image('background', 'images/bg_layer1.png')
        this.load.image('gameover', 'images/gameover.png')
        this.load.image('replay-button', 'images/replay.png')
    }

    create() //define the undefined objects stated in init
    {
        this.add.image(200, 320, 'background')
        this.add.image(200, 200, 'gameover')
        // @ts-ignore
        this.add.text(80, 300, 'SCORE:', { fontSize: '60px', fill: '#000' })
        // @ts-ignore
        this.add.text(300, 300, this.score, { fontSize: '60px', fill: '#000' })
        this.replayButton = this.add.image(200, 530, 'replay-button').setInteractive()
        this.replayButton.once('pointerup', () => { this.scene.start('corona-buster-scene') }, this)
    }
}

//main.js
import Phaser from 'phaser'

import CoronaBusterScene from './scenes/CoronaBusterScene';
import GameOverScene from './scenes/GameOverScene';


const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 620,
    physics: {
        default: 'arcade'
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [CoronaBusterScene, GameOverScene]
}

export default new Phaser.Game(config)

//FallingObject.js
import Phaser from 'phaser'
export default class FallingObject extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, config) {
        super(scene, x, y, texture)

        this.scene = scene
        this.speed = config.speed
        this.rotationVal = config.rotation
    }

    spawn(x) {
        const positionX = Phaser.Math.Between(-50, -70)

        this.setPosition(x, positionX)

        this.setActive(true)
        this.setVisible(true)
    }

    die() {
        this.destroy()
    }

    update(time) {
        this.setVelocityY(this.speed)
        this.rotation += this.rotationVal
        const gameHeight = this.scene.scale.height

        if (this.y > gameHeight + 5) {
            this.die
        }
    }
}

//Laser.js
import Phaser from "phaser"
export default class Laser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture)
        this.setScale(2)
        this.speed = 200
    }

    fire(x, y) {
        this.setPosition(x, y - 50)
        this.setActive(true)
        this.setVisible(true)
    }

    erase() {
        this.destroy()
    }

    update(time) {
        this.setVelocityY(this.speed * -1)
        if (this.y < -10) {
            this.erase()
        }
    }
}

//ScoreLabel.js
import Phaser from "phaser"
const formatScore = (gameScore) => `Score: ${gameScore}`
export default class ScoreLabel extends Phaser.GameObjects.Text {
    constructor(scene, x, y, score, style) {
        super(scene, x, y, formatScore(score), style)
        this.score = score
    }

    setScore(score) {
        this.score = score
        this.setText(formatScore(this.score))
    }

    getScore() {
        return this.score
    }

    add(points) {
        this.setScore(this.score + points)
    }

}

//LifeLabel.js
import Phaser from "phaser"
const formatLife = (gameLife) => `Life: ${gameLife}`
export default class LifeLabel extends Phaser.GameObjects.Text {
    constructor(scene, x, y, lifePlayer, style) {
        super(scene, x, y, formatLife(lifePlayer), style)
        this.life = lifePlayer

    }

    setLife(lifePlayer) {
        this.life = lifePlayer
        this.setText(formatLife(this.life))
    }

    getLife() {
        return this.life
    }

    add(points) {
        this.setLife(this.life + points)
    }

    subtract(value) {
        this.setLife(this.life - value)
    }
}