<template>
    <Transition name="fade">
        <iframe class="mapView"
            src="https://www.google.com/maps/d/embed?mid=1wi0mbgjRg4tgWqlLEeY7-c136TqvWSc&ehbc=2E312F" width="600"
            height="450" style="border:0;" allowfullscreen="false" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"></iframe>
    </Transition>
</template>
<style scoped>
.mapView {
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>