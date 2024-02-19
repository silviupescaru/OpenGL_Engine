#version 410 core

in vec3 fNormal;
in vec3 fPosEye;
in vec2 fTexCoords;
in vec4 fragPosLightSpace;

out vec4 fColor;

//lighting
uniform	vec3 lightDir;
uniform	vec3 lightColor;
uniform vec3 lightPunctiform;
uniform vec3 lightPunctiformColor;
uniform mat4 view;
uniform mat4 model;
uniform vec3 lightPosWorld;

//texture
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;
uniform sampler2D shadowMap;

uniform bool switchCeata;
uniform bool switchLuminaPunctiforma;
uniform bool switchLuminaGlobala;

vec3 ambient;
vec3 ambientPunctiform;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
vec3 specularPunctiform;
float specularStrength = 0.5f;
float shininess = 32.0f;

vec4 fPosition;

void computeLightComponents()
{		
	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	
	
	//compute light direction
	vec3 lightDirN = normalize(lightDir);
	
	//compute view direction 
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
		
	//compute ambient light
	ambient = ambientStrength * lightColor;
	
	//compute diffuse light
	diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	
	//compute specular light
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
	specular = specularStrength * specCoeff * lightColor;
}

vec3 luminaPunctiforma()
{		
	fPosition = vec4(fPosEye, 1.0f);

	vec3 lightPosEye = vec3(21.62f, 3.39f, -15.99f);

	float constant = 1.0f;
	float linear = 0.0045f;
	float quadratic = 0.0075f;

	float dist = length(lightPosEye - fPosition.xyz);
	float att = 1.0f / (constant + linear * dist + quadratic * (dist * dist));
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	

	//compute light direction
	vec3 lightDirN = normalize(lightPosEye - fPosition.xyz);
	
	//compute view direction 
	vec3 viewDirN = normalize(lightPosEye - fPosition.xyz);

	vec3 halfVector = normalize(lightDirN + viewDirN);
		
	//compute ambient light
	vec3 ambientPunctiform = att * ambientStrength * lightPunctiformColor;
	
	//compute diffuse light
	vec3 diffusePunctiform = att * max(dot(normalEye, lightDirN), 0.0f) * lightPunctiformColor;
	
	//compute specular light
	float specCoeff = pow(max(dot(viewDirN, halfVector), 0.3f), 32.0f);
	vec3 specularPunctiform = att * specularStrength * specCoeff * lightPunctiformColor;

	vec4 diff = texture(diffuseTexture, fTexCoords);
	vec4 spec = texture(specularTexture, fTexCoords);

	return min(((ambientPunctiform + diffuse) * diff.rgb + specularPunctiform * spec.rgb) * att * 1.5f, 1.0f);
}

float computeShadow()
{

	vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

	normalizedCoords = normalizedCoords * 0.5 + 0.5;
	
	if (normalizedCoords.z > 1.0f) return 0.0f;

	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;

	float currentDepth = normalizedCoords.z;

	float bias = max(0.05f * (1.0f - dot(fNormal,lightDir)), 0.05f);
	float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;	

	return shadow;

}

float computeFog()
{
	fPosition = view * model * vec4(fPosition);
	float fogDensity = 0.007f;
	float fragmentDistance = length(fPosition);
	float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));

	return clamp(fogFactor, 0.0f, 1.0f);
}

void main() {

	computeLightComponents();
	float shadow = computeShadow();
	vec3 punctiforma = luminaPunctiforma();
	
	ambient *= texture(diffuseTexture, fTexCoords).rgb;
	diffuse *= texture(diffuseTexture, fTexCoords).rgb;
	specular *= texture(specularTexture, fTexCoords).rgb;


	vec3 color = min((ambient + (1.0f - shadow) * diffuse) + (1.0f - shadow) * specular, 1.0f);

	if(switchLuminaGlobala == false){
		color = vec3(0.0f);
	}

	if(switchLuminaPunctiforma){
		color += punctiforma;
	}

	if(switchCeata) {        
        float fogFactor = computeFog();
        vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);
        fColor = fogColor * (1 - fogFactor) + vec4(color, 1.0f) * fogFactor;
    }else {
        fColor = vec4(color, 1.0f);
    }
}
