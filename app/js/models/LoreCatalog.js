/* =========================================================
   LoreCatalog (Model)
   The AlphaCryptids, the 26 basic lands of the Urza's
   Abacus giveaway, and the land each one is printed on.
   The Lore button on a seat lists the cryptids of that
   seat's land.

   lands uses the card's printed land: W Plains, U Island,
   B Swamp, R Mountain, G Forest. A card printed with two
   symbols (Kraken, Wendigo) belongs to both lands.
   ========================================================= */
(function (EDH) {
  'use strict';

  const CRYPTIDS = Object.freeze([
    { name: 'Altamaha-ha',       lands: 'U',  region: 'Altamaha River, Georgia, USA',                  description: 'A finned, snouted river serpent said to glide through the tidal marshes.' },
    { name: 'Bigfoot',           lands: 'G',  region: 'Pacific Northwest, USA and Canada',             description: 'A huge, hairy, ape-like giant that walks upright through the deep woods.' },
    { name: 'Chupacabra',        lands: 'B',  region: 'Puerto Rico, Mexico and the US Southwest',      description: 'A spiny, red-eyed prowler blamed for draining livestock of their blood.' },
    { name: 'Dingonek',          lands: 'B',  region: 'Rivers of southern Kenya',                      description: 'A scaly, tusked river beast that early hunters swore their bullets bounced off.' },
    { name: 'Elwedritsch',       lands: 'W',  region: 'Palatinate, Germany',                           description: 'A chicken-like bird with antlers and scales, its wings too small to fly.' },
    { name: 'Fouke',             lands: 'B',  region: 'Fouke, Arkansas, USA',                          description: 'The Fouke Monster: a tall, foul-smelling hairy creature of the Boggy Creek bottomlands.' },
    { name: 'Gunni',             lands: 'W',  region: 'Marysville, Victoria, Australia',               description: 'An antlered, striped, wombat-like marsupial, and a famous taxidermy hoax.' },
    { name: 'Hodag',             lands: 'G',  region: 'Rhinelander, Wisconsin, USA',                   description: 'A horned, spike-backed, grinning beast born of an 1890s lumber-camp hoax.' },
    { name: 'Igopogo',           lands: 'U',  region: 'Lake Simcoe, Ontario, Canada',                  description: 'A dog-faced, seal-like lake monster with a long neck.' },
    { name: 'Jackalope',         lands: 'W',  region: 'Wyoming and the American West',                 description: 'A jackrabbit with antelope horns, said to mimic cowboys singing by the fire.' },
    { name: 'Kraken',            lands: 'UB', region: 'Seas off Norway and Greenland',                 description: 'A colossal many-armed sea monster that drags whole ships beneath the waves.' },
    { name: 'Loch Ness Monster', lands: 'U',  region: 'Loch Ness, Scottish Highlands',                 description: 'A long-necked creature glimpsed in the dark, peaty waters of the loch.' },
    { name: 'Moth Man',          lands: 'B',  region: 'Point Pleasant, West Virginia, USA',            description: 'A man-sized winged figure with glowing red eyes, seen in 1966 and 1967.' },
    { name: 'Nguma Monene',      lands: 'G',  region: 'Republic of the Congo and Cameroon',            description: 'A giant serpent-like reptile with legs and a saw-toothed ridge down its back.' },
    { name: 'Otso',              lands: 'G',  region: 'Finland',                                       description: 'The sacred bear spirit, king of the forest, never called by its true name.' },
    { name: 'Pedula',            lands: 'U',  region: 'La Ferté-Bernard, France',                      description: 'A shaggy riverbank dragon whose quills were tipped with poison.' },
    { name: 'Qalupalik',         lands: 'U',  region: 'Inuit lands of the Arctic',                     description: 'A green-skinned sea woman who snatches children who wander too close to the ice.' },
    { name: 'Ropen',             lands: 'G',  region: 'Papua New Guinea',                              description: 'A bat-winged, long-tailed flyer said to glow as it crosses the night sky.' },
    { name: 'Skunk Ape',         lands: 'B',  region: 'Florida Everglades, USA',                       description: 'A reeking, ape-like giant that roams the swamps.' },
    { name: 'Thunderbird',       lands: 'R',  region: 'Indigenous nations of North America',           description: 'A gigantic bird whose wingbeats roll across the sky as thunder.' },
    { name: 'Unicorn',           lands: 'G',  region: 'Europe; the national animal of Scotland',      description: 'A pure-white horse with a single spiraled horn, a symbol of purity.' },
    { name: 'Vedrfolnir',        lands: 'R',  region: 'Norse mythology, Scandinavia',                  description: 'The hawk that sits between the eyes of the eagle atop the world tree, Yggdrasil.' },
    { name: 'Wendigo',           lands: 'UB', region: 'Algonquian peoples, Great Lakes and Canada',    description: 'A gaunt, ice-hearted spirit of winter starvation and endless hunger.' },
    { name: 'Xindhi',            lands: 'G',  region: 'Albania',                                       description: 'Invisible elf-like spirits whose coming is signaled by a creaking door or a flickering flame.' },
    { name: 'Yeti',              lands: 'R',  region: 'Himalayas, Nepal and Tibet',                    description: 'A shaggy ape-man of the high snows, known by its giant footprints.' },
    { name: 'Zamzummin',         lands: 'G',  region: 'East of the Jordan River (Hebrew Bible)',       description: 'An ancient race of giants, "as tall as the Anakim," driven out by the Ammonites.' }
  ].map(Object.freeze));

  class LoreCatalog {
    constructor(config) {
      this.config = config;
    }

    /** Every AlphaCryptid printed on this land, A to Z. */
    forLand(landId) {
      const land = this.config.LANDS[landId];
      return land ? CRYPTIDS.filter(c => c.lands.includes(land.color)) : [];
    }

    get all() { return CRYPTIDS; }
  }

  EDH.LoreCatalog = LoreCatalog;
})(window.EDH = window.EDH || {});
