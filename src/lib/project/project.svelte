<script>
    export let individualProject;

    export let projectNode = {};
    // $: console.log(projectNode);
    $: {
        if (projectNode) {
            projectNode["projectCardOffsetLeft"] = projectNode.offsetLeft;
            projectNode["projectCardOffsetHeight"] = projectNode.offsetHeight;
        }
        // projectNode.forEach((projectNode, i) => {

        // });
    }
    let projectText = individualProject.projectDescription;
    let titleHeight = 36;

    let rotateXAxis, rotateYAxis;
    let projectCard = {};

    let mouseX,
        mouseY,
        rotateXY = ``;

    $: {
        const rotateXAxis = (mouseX / projectCard.clientWidth) * 25;
        const rotateYAxis = (mouseY / projectCard.clientHeight) * -25;
        rotateXY = `transform: rotateY(${rotateXAxis}deg) rotateX(${rotateYAxis}deg)`;
    }

    function handleMouseMove(e) {
        // https://www.javascripttutorial.net/javascript-dom/javascript-width-height/

        mouseX = e.pageX - projectNode.offsetLeft - projectCard.clientWidth / 2;
        mouseY = e.pageY - projectNode.offsetTop - projectCard.clientHeight / 2;
    }
    function handleMouseLeave() {
        // setTimeout(()=>{
        // mouseX = 0;
        // mouseY = 0;
        rotateXY = ``;
        //   }, 1000);
    }
</script>

<div
    class="front relative border-black w-full h-full lg:h-[400px] bg-cover bg-no-repeat bg-center"
    style="background-image: url({individualProject.projectImgSource});border-bottom-width: {titleHeight}px;"
>
    <div
        class="absolute w-full flex justify-center text-center "
        bind:clientHeight={titleHeight}
        style="bottom: -{titleHeight}px"
    >
        <a
            href={individualProject.projectLink}
            class="font-bold font-icon lg:text-[1.5rem]"
            >{individualProject.projectName}</a
        >
    </div>
</div>
<!-- on:mousemove={handleMouseMove} -->
<div
    class="back card-wrap w-full h-full lg:h-[400px] flex flex-col justify-center items-center"
    style={rotateXY}
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    bind:this={projectCard}
>
    <div class="card flex flex-col justify-center text-center">
        <a
            href={individualProject.projectLink}
            class=" font-heading lg:text-[1.5rem]"
            >{individualProject.projectName}</a
        >
        {#each individualProject.tools as tool}
            <p class="font-light">{tool}</p>
        {/each}
    </div>
    <!-- <div class="message">
    {@html projectText}
</div> -->
    <div class="photo-by">Created By 涂钰坤, aka, Gordon Tu</div>
    <div class="stamp" />
</div>

<style lang="scss">
    $hoverEasing: cubic-bezier(0.23, 1, 0.32, 1);
    $returnEasing: cubic-bezier(0.445, 0.05, 0.55, 0.95);
    .front,
    .back {
        box-shadow: 0 0 20px 0 #999;
        border: 10px solid #fff;
        position: absolute;
    }

    .front {
        -webkit-transform: rotateX(0deg) rotateY(0deg);
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;

        -moz-transform: rotateX(0deg) rotateY(0deg);
        -moz-transform-style: preserve-3d;
        -moz-backface-visibility: hidden;

        /* -- transition is the magic sauce for animation -- */
        -o-transition: all 0.4s ease-in-out;
        -ms-transition: all 0.4s ease-in-out;
        -moz-transition: all 0.4s ease-in-out;
        -webkit-transition: all 0.4s ease-in-out;
        transition: all 0.4s ease-in-out;
    }

    :global(.postcard:hover .front) {
        -webkit-transform: rotateY(180deg);
        -moz-transform: rotateY(180deg);

        -moz-box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
        -webkit-box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
    }
    .back {
        -webkit-transform: rotateY(-180deg);
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;

        -moz-transform: rotateY(-180deg);
        -moz-transform-style: preserve-3d;
        -moz-backface-visibility: hidden;

        /* -- transition is the magic sauce for animation -- */
        -o-transition: all 0.4s ease-in-out;
        -ms-transition: all 0.4s ease-in-out;
        -moz-transition: all 0.4s ease-in-out;
        -webkit-transition: all 0.4s ease-in-out;
        transition: all 0.4s ease-in-out;
    }

    :global(.postcard:hover .back) {
        z-index: 1000;
        background-color: white;
        -webkit-transform: rotateX(0deg) rotateY(0deg);
        -moz-transform: rotateX(0deg) rotateY(0deg);
    }

    .message,
    .address {
        font-family: "HanYiShouJinShuFan", cursive;
    }

    // .message {
    //     float: left;
    //     width: 300px;
    //     box-sizing: border-box;
    //     padding: 4em 2em 2em;
    // }

    // .message:after {
    //     content: "";
    //     position: absolute;
    //     width: 1px;
    //     height: 300px;
    //     background: #eaeaea;
    //     top: 30px;
    //     left: 300px;
    // }

    // .address {
    //     float: left;
    //     width: 250px;
    //     box-sizing: border-box;
    //     padding: 7em 2em 2em;

    //     p {
    //         margin: 0.5em 0 0;
    //     }
    // }

    .photo-by {
        position: absolute;
        right: 10px;
        bottom: 10px;
        color: #777;
        font-size: 0.4em;
    }

    .stamp {
        width: 60px;
        height: 90px;
        position: absolute;
        top: 10px;
        right: 10px;
        background-image: url("/印章.png");
        background-size: cover;
        padding: 5px;
        // border: 2px dotted #fff;
        .inner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            position: absolute;
            top: 5px;
            bottom: 5px;
            left: 5px;
            right: 5px;
            color: #fff;
            font-family: roboto, serif;
            font-weight: 100;
            font-size: 2em;
            padding-top: 4px;
            text-align: center;
        }
    }
</style>
