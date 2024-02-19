#version 410 core

layout(location=0) in vec3 vPosition;

out vec4 fragPosLightSpace;

uniform mat4 lightSpaceTrMatrix;
uniform mat4 model;

void main(){
    fragPosLightSpace = lightSpaceTrMatrix * model * vec4(vPosition, 1.0f);
    gl_Position = lightSpaceTrMatrix * model * vec4(vPosition, 1.0f);
}