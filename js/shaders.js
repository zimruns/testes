const VERTEX_SHADER = `
    attribute vec3 coordinates;
    attribute vec3 normal;
    attribute vec2 aTextureCoord;
    
    uniform mat4 uMatrix;
    uniform mat4 uNormalMatrix;
    uniform vec3 uLightPosition;
    
    varying vec3 vNormal;
    varying vec3 vLightDirection;
    varying vec2 vTextureCoord;
    varying vec3 vViewDirection;
    
    void main(void) {
        vec4 position = uMatrix * vec4(coordinates, 1.0);
        gl_Position = position;
        vNormal = (uNormalMatrix * vec4(normal, 0.0)).xyz;
        vec3 worldPosition = position.xyz / position.w;
        vLightDirection = normalize(uLightPosition - worldPosition);
        vViewDirection = normalize(-worldPosition);
        vTextureCoord = aTextureCoord;
    }
`;

const FRAGMENT_SHADER = `
    precision mediump float;
    
    varying vec3 vNormal;
    varying vec3 vLightDirection;
    varying vec2 vTextureCoord;
    varying vec3 vViewDirection;
    
    uniform vec4 uColor;
    uniform sampler2D uSampler;
    uniform bool uUseTexture;
    uniform vec3 uAmbient;
    uniform vec3 uDiffuse;
    uniform vec3 uSpecular;
    uniform float uShininess;
    
    void main(void) {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(vLightDirection);
        vec3 viewDir = normalize(vViewDirection);
        
        vec3 ambient = uAmbient;
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * uDiffuse;
        
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
        vec3 specular = spec * uSpecular;
        
        vec3 result = ambient + diffuse + specular;
        vec4 finalColor;

        if (uUseTexture) {
            finalColor = texture2D(uSampler, vTextureCoord) * vec4(result, 1.0);
        } else {
            finalColor = uColor * vec4(result, 1.0);
        }
        
        gl_FragColor = finalColor;
    }
`;

function createShaderProgram(gl, vertexShader, fragmentShader) {
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vShader, vertexShader);
    gl.shaderSource(fShader, fragmentShader);

    gl.compileShader(vShader);
    gl.compileShader(fShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    return shaderProgram;
}