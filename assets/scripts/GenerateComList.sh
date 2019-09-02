rm -f "build/$comPortsFile"

touch "build/$comPortsFile"

line=$(cmd.exe /c mode)
for comLine in $line ; do
    if [[ $comLine == *"COM"* ]]; then
        echo -e "${comLine%:*}" >> "build/$comPortsFile"
    fi
done

cat "build/$comPortsFile" > "build/$comPortsFile.txt"
sleep 1
rm -f "build/$comPortsFile"