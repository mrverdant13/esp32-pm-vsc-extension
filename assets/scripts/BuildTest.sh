rm main/main.cpp
echo "#include \"test/${testFile}\"" > main/main.cpp
echo "extern \"C\"" >> main/main.cpp
echo "{" >> main/main.cpp
echo "void app_main();" >> main/main.cpp
echo "}" >> main/main.cpp
rm -r "build/main"
clear
make -j all