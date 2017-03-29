copy "C:\Users\tiz_000\Documents\visual studio 2015\Projects\TMP\my-release-key.keystore" "C:\Users\tiz_000\Documents\visual studio 2015\Projects\TMP\TMP\bin\Android\Release\my-release-key.keystore"
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-release-unsigned.apk alias-name
"c:\Program Files (x86)\Android\android-sdk\build-tools\23.0.1\zipalign" -v 4 android-release-unsigned.apk tmp.apk
