export const resolveInitialAvatarName = ({
  updatedAvatar,
  persistedAvatar,
} = {}) => {
  if (updatedAvatar) {
    return updatedAvatar;
  }

  if (persistedAvatar) {
    return persistedAvatar;
  }

  return 'Prithi';
};
