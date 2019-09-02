cd "$msys32Loc/home"
rm -f -r "esp-idf"
git clone --recursive https://github.com/espressif/esp-idf.git
cd "$msys32Loc/etc/profile.d"
rm -f export_idf_path.sh
echo -e "export IDF_PATH=\"$msys32Loc/home/esp-idf\"" > export_idf_path.sh