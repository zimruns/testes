function main() {
    const canvas = document.getElementById('tissue-box-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    
    const renderer = new TissueBoxRenderer(gl);

    function animate() {
        renderer.drawFrame();
        requestAnimationFrame(animate);
    }

    animate();
}

document.addEventListener('DOMContentLoaded', main);