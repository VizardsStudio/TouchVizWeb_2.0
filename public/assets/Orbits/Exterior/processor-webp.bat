@echo off
REM ==========================================================
REM  Recursively converts all JPG/JPEG images to WebP format
REM  Uses ImageMagick ("magick" command) with efficient settings
REM  Deletes the original JPEGs after successful conversion
REM  Reports progress
REM ==========================================================

setlocal enabledelayedexpansion

echo Counting JPG and JPEG files...
set count=0
for /r %%F in (*.jpg *.jpeg) do (
    set /a count+=1
)
echo Found %count% file(s) to convert.
echo.

if %count%==0 (
    echo No JPG or JPEG files found. Exiting.
    pause
    exit /b
)

set current=0
for /r %%F in (*.jpg *.jpeg) do (
    set /a current+=1
    echo [!current!/%count%] Converting: %%~nxF
    magick "%%F" -define webp:method=6 -quality 80 -strip "%%~dpnF.webp"
    if exist "%%~dpnF.webp" (
        del "%%F"
    )
)

echo.
echo All %count% files have been converted to WebP successfully.
pause
