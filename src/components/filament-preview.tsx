import { ImageBackground, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import {
  Camera,
  EnvironmentalLight,
  FilamentScene,
  FilamentView,
  Light,
  ModelRenderer,
  useModel,
} from "react-native-filament";

import CamiliaModel from "../../assets/models/camilia.glb";
import PrithiModel from "../../assets/models/prithi.glb";

export type NativeAvatarId = "prithi" | "camilia";

type AvatarRenderConfig = {
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  focalLength: number;
  scale: [number, number, number];
  translate: [number, number, number];
};

const AVATAR_RENDER_CONFIG: Record<NativeAvatarId, AvatarRenderConfig> = {
  camilia: {
    cameraPosition: [0, 0.26, 2.2],
    cameraTarget: [0, 0.24, 0],
    focalLength: 42,
    scale: [1.32, 1.32, 1.32],
    translate: [0, -0.34, 0],
  },
  prithi: {
    cameraPosition: [0, 0.28, 2.15],
    cameraTarget: [0, 0.26, 0],
    focalLength: 42,
    scale: [1.34, 1.34, 1.34],
    translate: [0, -0.36, 0],
  },
};

type FilamentPreviewProps = {
  avatarId?: NativeAvatarId;
  backgroundColor?: string;
  backgroundImageSource?: ImageSourcePropType;
  displayName?: string;
  morphWeights: Record<string, number>;
  idlePose: {
    translateY: number;
    rotateY: number;
    rotateZ: number;
  };
  skeletonPose: {
    bodyRotateX: number;
    bodyRotateY: number;
    bodyRotateZ: number;
    chestInhale: number;
    headRotateX: number;
    headRotateY: number;
    headRotateZ: number;
  };
};

type AvatarModelProps = {
  avatarId: NativeAvatarId;
  idlePose: FilamentPreviewProps["idlePose"];
};

function AvatarModel({ avatarId, idlePose }: AvatarModelProps) {
  const config = AVATAR_RENDER_CONFIG[avatarId];
  const source = avatarId === "camilia" ? CamiliaModel : PrithiModel;
  const model = useModel(source, {
    addToScene: true,
    shouldReleaseSourceData: false,
  });

  if (model.state !== "loaded") {
    return null;
  }

  return (
    <ModelRenderer
      castShadow={false}
      model={model}
      receiveShadow={false}
      rotate={[
        0,
        idlePose.rotateY * 0.03,
        0,
      ]}
      scale={config.scale}
      transformToUnitCube
      translate={[
        config.translate[0],
        config.translate[1] + idlePose.translateY * 0.15,
        config.translate[2],
      ]}
    />
  );
}

function AvatarScene({
  avatarId,
  idlePose,
  morphWeights: _morphWeights,
}: {
  avatarId: NativeAvatarId;
  idlePose: FilamentPreviewProps["idlePose"];
  morphWeights: Record<string, number>;
}) {
  const config = AVATAR_RENDER_CONFIG[avatarId];

  return (
    <FilamentScene>
      <FilamentView enableTransparentRendering style={styles.viewport}>
        <Camera
          cameraPosition={[
            config.cameraPosition[0],
            config.cameraPosition[1] + idlePose.translateY * 0.12,
            config.cameraPosition[2],
          ]}
          cameraTarget={[
            config.cameraTarget[0],
            config.cameraTarget[1],
            config.cameraTarget[2],
          ]}
          focalLengthInMillimeters={config.focalLength}
          near={0.05}
          far={24}
        />
        <EnvironmentalLight source={{ uri: "RNF_default_env_ibl.ktx" }} />
        <Light
          castShadows={false}
          colorKelvin={6200}
          direction={[0.1, -1, -0.35]}
          intensity={45000}
          type="directional"
        />
        <Light
          colorKelvin={5800}
          falloffRadius={8}
          intensity={1200}
          position={[0, 1.4, 2.2]}
          type="point"
        />
        <AvatarModel avatarId={avatarId} idlePose={idlePose} />
      </FilamentView>
    </FilamentScene>
  );
}

export function FilamentPreview({
  avatarId = "prithi",
  backgroundColor = "#ffffff",
  backgroundImageSource,
  displayName = "Prithi",
  morphWeights,
  idlePose,
}: FilamentPreviewProps) {
  const content = (
    <>
      <View style={[styles.shell, { backgroundColor: backgroundImageSource ? "transparent" : backgroundColor }]}>
        <AvatarScene avatarId={avatarId} idlePose={idlePose} morphWeights={morphWeights} />
      </View>
      <Text allowFontScaling={false} style={styles.name}>
        {displayName}
      </Text>
    </>
  );

  if (backgroundImageSource) {
    return (
      <ImageBackground
        resizeMode="cover"
        source={backgroundImageSource}
        style={[styles.section, { backgroundColor }]}
      >
        {content}
      </ImageBackground>
    );
  }

  return <View style={[styles.section, { backgroundColor }]}>{content}</View>;
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 260,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  shell: {
    backgroundColor: "#ffffff",
    height: 218,
    overflow: "hidden",
    width: "100%",
  },
  viewport: {
    flex: 1,
  },
  name: {
    bottom: 16,
    color: "#000000",
    fontSize: 13,
    position: "absolute",
    right: 24,
  },
});
