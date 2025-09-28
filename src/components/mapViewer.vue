<template>
    <Transition name="fade">
        <iframe class="mapView" src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4530.419356168646!2d44.40900666769094!3d33.326306659932236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2siq!4v1759059578464!5m2!1sen!2siq" width="600" height="450" style="border:0;" allowfullscreen="false" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </Transition>
</template>
<style scoped>
.mapView{
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>