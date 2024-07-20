let game;

const gameOptions = {
    dudeGravity: 800,
    dudeSpeed: 300
}

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#112211",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 1000,
        },
        pixelArt: true,
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0
                }
            }
        },
        scene: PlayGame
    }

    game = new Phaser.Game(gameConfig);
    window.focus();
}

class PlayGame extends Phaser.Scene {

    constructor() {
        super("PlayGame");
        this.score = 0;
    }

    preload() {
        this.load.image("ground", "assets/platform.png");
        this.load.image("star", "assets/star.png");
        this.load.image("enemy", "assets/enemy.png");
        this.load.image("coin", "assets/coin.png");
        this.load.image("powerup", "assets/powerup.png");
        this.load.image("bullet", "assets/bullet.png"); 
        this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });

        for(let i = 0; i < 20; i++) {
            this.groundGroup.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "ground");
        }

        this.dude = this.physics.add.sprite(game.config.width / 2, game.config.height / 2, "dude");
        this.dude.body.gravity.y = gameOptions.dudeGravity;
        this.physics.add.collider(this.dude, this.groundGroup);

        this.starsGroup = this.physics.add.group({});
        this.physics.add.collider(this.starsGroup, this.groundGroup);

        this.physics.add.overlap(this.dude, this.starsGroup, this.collectStar, null, this);

        this.add.image(16, 16, "star");
        this.scoreText = this.add.text(32, 3, "0", { fontSize: "30px", fill: "#ffffff" });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "turn",
            frames: [{ key: "dude", frame: 4 }],
            frameRate: 10,
        });
        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        this.triggerTimer = this.time.addEvent({
            callback: this.addGround,
            callbackScope: this,
            delay: 700,
            loop: true
        });


        this.enemiesGroup = this.physics.add.group({
            key: "enemy",
            repeat: 4,
            setXY: { x: 12, y: 0, stepX: 150 },
            velocityY: gameOptions.dudeSpeed / 2,
        });
        this.enemiesGroup.children.iterate((enemy) => {
            enemy.setBounce(1);
            enemy.setCollideWorldBounds(true);
        });

        this.physics.add.collider(this.enemiesGroup, this.groundGroup);
        this.physics.add.overlap(this.dude, this.enemiesGroup, this.hitEnemy, null, this);


        this.collectiblesGroup = this.physics.add.group({
            key: "coin",
            repeat: 2,
            setXY: { x: 100, y: 0, stepX: 200 },
            velocityY: gameOptions.dudeSpeed / 2,
        });

        this.physics.add.collider(this.collectiblesGroup, this.groundGroup);
        this.physics.add.overlap(this.dude, this.collectiblesGroup, this.collectItem, null, this);

        this.powerUpsGroup = this.physics.add.group({
            key: "powerup",
            repeat: 1,
            setXY: { x: 150, y: 0, stepX: 300 },
            velocityY: gameOptions.dudeSpeed / 2,
        });

        this.physics.add.collider(this.powerUpsGroup, this.groundGroup);
        this.physics.add.overlap(this.dude, this.powerUpsGroup, this.collectPowerUp, null, this);


        this.bulletsGroup = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10,
            runChildUpdate: true 
        });

        this.input.keyboard.on('keydown-SPACE', this.shootBullet, this);

        this.physics.add.collider(this.bulletsGroup, this.enemiesGroup, this.hitEnemyWithBullet, null, this);
    }

    addGround() {
        console.log("Adding new stuff!");
        this.groundGroup.create(Phaser.Math.Between(0, game.config.width), 0, "ground");
        this.groundGroup.setVelocityY(gameOptions.dudeSpeed / 6);

        if(Phaser.Math.Between(0, 1)) {
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "star");
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed);
        }
    }

    collectStar(dude, star) {
        star.disableBody(true, true);
        this.score += 1;
        this.scoreText.setText(this.score);
    }

    collectItem(dude, item) {
        item.disableBody(true, true);
        this.score += 10; 
        this.scoreText.setText(this.score);
    }

    collectPowerUp(dude, powerUp) {
        powerUp.disableBody(true, true);
        this.dude.body.velocity.x *= 1.5;
        this.time.delayedCall(5000, () => {
            this.dude.body.velocity.x /= 1.5; 
        });
    }

    shootBullet() {
        let bullet = this.bulletsGroup.get(this.dude.x, this.dude.y);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.velocity.y = -400;
            bullet.body.velocity.x = 0;
            bullet.body.allowGravity = false;
            bullet.body.checkWorldBounds = true;
            bullet.body.outOfBoundsKill = true;
        }
    }

    hitEnemy(dude, enemy) {
        this.scene.restart(); 
    }

    hitEnemyWithBullet(bullet, enemy) {
        bullet.disableBody(true, true);
        enemy.disableBody(true, true);

        this.score += 20; 
        this.scoreText.setText(this.score);
    }

    update() {
        if (this.cursors.left.isDown) {
            this.dude.body.velocity.x = -gameOptions.dudeSpeed;
            this.dude.anims.play("left", true);
        } else if (this.cursors.right.isDown) {
            this.dude.body.velocity.x = gameOptions.dudeSpeed;
            this.dude.anims.play("right", true);
        } else {
            this.dude.body.velocity.x = 0;
            this.dude.anims.play("turn", true);
        }

        if (this.cursors.up.isDown && this.dude.body.touching.down) {
            this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6;
        }

        if (this.dude.y > game.config.height || this.dude.y < 0) {
            this.scene.restart();
        }
    }
}
