rm -f main/main.cpp
echo -e "#include \"src/${entryPoint}\"" > main/main.cpp
echo -e "extern \"C\"" >> main/main.cpp
echo -e "{" >> main/main.cpp
echo -e "\tvoid app_main();" >> main/main.cpp
echo -e "}" >> main/main.cpp
rm -f -r "build/main"
make -j all