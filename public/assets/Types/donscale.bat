@echo off
REM ==========================================================
REM  Recursively downscales all .webp images to 5% size
REM  Keeps originals and saves new ones with "_LD" suffix
REM  Requires ImageMagick ("magick" command)
REM  Reports progress
REM ==========================================================

setlocal enabledelayedexpansion

echo Counting WEBP files...
set count=0
for /r %%F in (*.webp) do (
    set /a count+=1
)
echo Found %count% file(s) to downscale.
echo.

if %count%==0 (
    echo No WEBP files found. Exiting.
    pause
    exit /b
)

set current=0
for /r %%F in (*.webp) do (
    set /a current+=1
    echo [!current!/%count%] Downscaling: %%~nxF
    magick "%%F" -resize 5%% "%%~dpnF_LD.webp"
)

echo.
echo All %count% WEBP files have been downscaled successfully.
pause
