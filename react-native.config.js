module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/android',
          packageImportPath: 'import io.invertase.firebase.RNFirebasePackage;',
        },
      },
    },
  },
  assets: ['./src/assets/fonts/'],
};