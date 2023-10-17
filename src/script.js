// Check for high latency every 10s
const highLatencyPollSeconds = 10000;

// Live latency target in seconds
const liveLatencyTarget = 3;

// Live latency threshold in seconds
const liveLatencyThreshold = 8;

// This function checks if the reported live latency is higher than a threshold
// and if so it attempts to move the seek the play head to a point close to live
//
// It is advised to add some form of rate limiting (perhaps once per N minutes) to this operation
// to prevent it causing constant skipping for viewers with very poor network conditions
function checkForHighLatency(player) {
    console.log("checkForHighLatency called");
    console.log("Current Latency: " + player.getLiveLatency());
    if (player.getLiveLatency() > liveLatencyThreshold) {
        console.log(
            "High latency detected! Attempting to move play head to live edge."
        );

        // Set playlist head close to live
        const videoEl = player.getHTMLVideoElement();
        const buffered = videoEl.buffered;
        const liveEdge = buffered.end(buffered.length - 1);
        const seekPos = liveEdge - liveLatencyTarget; // Move to a conservative 3s behind live edge
        console.log(
            `Live edge ${liveEdge}, currentTime: ${videoEl.currentTime}`
        );
        player.seekTo(seekPos);
    }
}

(function (IVSPlayerPackage) {
    // First, check if the browser supports the IVS player.
    if (!IVSPlayerPackage.isPlayerSupported) {
        console.warn("The current browser does not support the IVS player.");
        return;
    }

    const PlayerState = IVSPlayerPackage.PlayerState;
    const PlayerEventType = IVSPlayerPackage.PlayerEventType;

    // Initialize player
    const player = IVSPlayerPackage.create();
    console.log("IVS Player version:", player.getVersion());
    player.attachHTMLVideoElement(document.getElementById("video-player"));

    // Check every 5s if we are behind live edge
    setInterval(function () {
        checkForHighLatency(player);
    }, highLatencyPollSeconds);

    // Attach event listeners
    player.addEventListener(PlayerState.PLAYING, function () {
        console.log("Player State - PLAYING");
        console.log("Latency: " + player.getLiveLatency());
    });
    player.addEventListener(PlayerState.ENDED, function () {
        console.log("Player State - ENDED");
    });
    player.addEventListener(PlayerState.READY, function () {
        console.log("Player State - READY");
    });
    player.addEventListener(PlayerEventType.ERROR, function (err) {
        console.warn("Player Event - ERROR:", err);
    });
    player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, (cue) => {
        const metadataText = cue.text;
        const position = player.getPosition().toFixed(2);
        console.log(
            `PlayerEvent - TEXT_METADATA_CUE: "${metadataText}". Observed ${position}s after playback started.`
        );
    });

    player.addEventListener(PlayerState.BUFFERING, function () {
        console.log("Player State - BUFFERING");
    });

    player.addEventListener(PlayerEventType.REBUFFERING, function () {
        console.log("Player State - REBUFFERING");
        rebuffered = true;
    });

    // Setup stream and play
    player.setAutoplay(true);
    player.load(
        "https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8"
    );
    player.setVolume(0.5);
})(window.IVSPlayer);
