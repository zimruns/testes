class TissueBoxRenderer {
    constructor(gl) {
        this.gl = gl;
        this.angleX = 0;
        this.angleY = 0;

        this.program = createShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        this.loadTexture('assets/kayu.jpg');

        this.lightPosition = [0.0, 1.0, 0.8];
        this.materialProperties = {
             ambient: [0.4, 0.4, 0.4],
             diffuse: [0.7, 0.7, 0.7],
             specular: [1.0, 1.0, 1.0],
             shininess: 1.0
        };
    }

    loadTexture(url) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const pixel = new Uint8Array([200, 200, 200, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };
        image.src = url;
        this.texture = texture;
    }

    drawMesh(geometry, matrix, color, useTexture = false) {
        const gl = this.gl;
        gl.useProgram(this.program);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

        const coord = gl.getAttribLocation(this.program, "coordinates");
        gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coord);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

        const normal = gl.getAttribLocation(this.program, "normal");
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normal);

        if (useTexture) {
            const textureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, geometry.textureCoords, gl.STATIC_DRAW);

            const textureCoord = gl.getAttribLocation(this.program, "aTextureCoord");
            gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(textureCoord);
        }

        const uMatrix = gl.getUniformLocation(this.program, "uMatrix");
        gl.uniformMatrix4fv(uMatrix, false, matrix);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, matrix);
        mat4.transpose(normalMatrix, normalMatrix);
        const uNormalMatrix = gl.getUniformLocation(this.program, "uNormalMatrix");
        gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);

        const uLightPosition = gl.getUniformLocation(this.program, "uLightPosition");
        gl.uniform3fv(uLightPosition, this.lightPosition);

        const uAmbient = gl.getUniformLocation(this.program, "uAmbient");
        gl.uniform3fv(uAmbient, this.materialProperties.ambient);

        const uDiffuse = gl.getUniformLocation(this.program, "uDiffuse");
        gl.uniform3fv(uDiffuse, this.materialProperties.diffuse);

        const uSpecular = gl.getUniformLocation(this.program, "uSpecular");
        gl.uniform3fv(uSpecular, this.materialProperties.specular);

        const uShininess = gl.getUniformLocation(this.program, "uShininess");
        gl.uniform1f(uShininess, this.materialProperties.shininess);

        const uUseTexture = gl.getUniformLocation(this.program, "uUseTexture");
        gl.uniform1i(uUseTexture, useTexture ? 1 : 0);

        if (useTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            const uSampler = gl.getUniformLocation(this.program, "uSampler");
            gl.uniform1i(uSampler, 0);
        } else {
            const uColor = gl.getUniformLocation(this.program, "uColor");
            gl.uniform4fv(uColor, color);
        }

        gl.drawArrays(gl.TRIANGLES, 0, geometry.vertices.length / 3);
    }

    drawFrame() {
        const gl = this.gl;
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const matrix = mat4.create();
        mat4.perspective(matrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
        mat4.translate(matrix, matrix, [0, 0, -4]);
        
        this.angleX += 0.01;
        this.angleY += 0.01;
        mat4.rotateX(matrix, matrix, this.angleX);
        mat4.rotateY(matrix, matrix, this.angleY);

        this.drawMesh(TissueBoxGeometry.inner, matrix, Colors.innerBox);
        this.drawMesh(TissueBoxGeometry.tissue, matrix, Colors.tissue);
        this.drawMesh(TissueBoxGeometry.outerTop, matrix, null, true);
        
        gl.depthMask(false);
        this.drawMesh(TissueBoxGeometry.outer, matrix, Colors.outerBox);
        gl.depthMask(true);
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}