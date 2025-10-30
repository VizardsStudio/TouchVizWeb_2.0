@echo off
setlocal enabledelayedexpansion

:: Choose the extension (auto-detect jpg or webp)
set "ext="
for %%E in (jpg webp jpeg) do (
    if exist "*.%%E" (
        set "ext=%%E"
        goto :foundext
    )
)

echo No JPG or WEBP files found in this directory.
pause
exit /b

:foundext
echo Detected extension: %ext%
echo Renaming files...

set /a count=0

:: Sort files alphabetically to preserve order
for /f "delims=" %%f in ('dir /b /a-d *.%ext% ^| sort') do (
    set "num=0000!count!"
    set "num=!num:~-4!"
    ren "%%f" "!num!.%ext%"
    echo Renamed %%f → !num!.%ext%
    set /a count+=1
)

echo.
echo Done! Renamed !count! files to 0000.%ext%, 0001.%ext%, etc.
pause
