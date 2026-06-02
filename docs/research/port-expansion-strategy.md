# Port Expansion Strategy

This document defines a direction for expanding the world port network. The
current implementation has 100 regular ports and 30 supply ports, for a total
of 130 map nodes.

The desired expansion is more than doubling the current port count while also
making Asia, especially China, feel like a major civilizational and economic
center rather than a distant endpoint.

## Expansion Goal

Target range:

- Regular ports: 210-240
- Supply ports and anchorages: 60-80
- Total map nodes: 270-320

This is large enough to make the world feel denser, but still small enough to
govern with explicit data and tests.

## Design Principles

### Do Not Treat All Ports Equally

The expanded world should use port classes instead of making every place a full
building set.

Suggested classes:

- `capital`: political center with ruler/palace relevance.
- `major-port`: full city port with market, pub, shipyard, bank, lodge, and
  story potential.
- `trade-hub`: goods, market intelligence, banks, guilds, and merchant events.
- `shipbuilding-port`: strong shipyard identity or regional hull types.
- `pilgrimage-port`: religious routes, donations, pilgrim transport, special
  reputation.
- `knowledge-port`: mapmakers, scholars, discoveries, books, translators.
- `river-gateway`: dockable coastal/river entry to a major inland city.
- `inland-hub`: important world location reached through river/overland
  connectors, not normal open-sea docking.
- `supply-port`: water, food, repair help, rumors, weather advice.
- `anchorage`: minimal stop with a name, risk profile, and nearby discovery.

### Give Asia More Internal Density

The original-style map has many European and Mediterranean ports, but Asia
should not be only a chain of distant stops. A stronger Asia means:

- China has several coastal and river/canal nodes, not only Macao, Zeiton, and
  Changan.
- South China Sea trade becomes a dense network.
- Japan, Korea, Ryukyu, Taiwan, and Southeast Asia have their own regional
  routes.
- Indian Ocean commerce connects Gujarat, Bengal, the Coromandel Coast,
  Sri Lanka, the Malay world, Arabia, and East Africa.
- Ports can represent local powers and merchant worlds, not just European
  arrival points.

### Separate Historical Identity From Gameplay Access

Some historically important cities are not open-sea ports. They should still
matter, but through correct access types:

- Changan can remain a special inland cultural endpoint.
- Nanjing and Hangzhou can be river/canal gateways.
- Beijing should not behave like a normal harbor; it can be reached through a
  northern gateway such as Tianjin/Dagu.
- Ayutthaya, Pegu, and inland capitals can use river-gateway logic.

This avoids making the world more detailed at the cost of making it less
believable.

## Current Asia Coverage

Current regular Asian ports include:

- Middle East and Arabia: Aden, Hormuz, Basra, Mecca, Muscat, Shiraz.
- India and Sri Lanka: Diu, Cochin, Ceylon, Goa, Calicut.
- Southeast Asia and Indonesia: Malacca, Ternate, Banda, Dili, Pasei, Sunda,
  Bankao.
- China and Vietnam: Zeiton, Macao, Hanoi, Changan.
- Japan: Sakai, Nagasaki.

This is enough for original-style long-distance travel, but too sparse for a
modernized world model.

## China Expansion

China should become one of the most important regional networks in the game.
The design should reflect Ming-era economic strength, coastal trade,
river/canal logistics, scholarship, state power, and the tension between formal
maritime restrictions and active private commerce.

### Proposed China Port And City Classes

Major coastal and river-gateway candidates:

| Candidate | Suggested class | Role |
| --- | --- | --- |
| Guangzhou / Canton | `major-port`, `trade-hub` | South China gateway, foreign trade, porcelain, silk, scholars. |
| Macao | `trade-hub`, `contact-port` | Existing port; Portuguese contact and South China Sea bridge. |
| Quanzhou / Zeiton | `major-port`, `knowledge-port` | Existing port; historic maritime identity and route memory. |
| Fuzhou | `trade-hub`, `shipbuilding-port` | Fujian merchant coast, timber, shipbuilding contacts. |
| Yuegang / Haicheng | `trade-hub`, `smuggling-port` | Fujian private maritime commerce and Japan/Southeast Asia route hook. |
| Wenzhou | `regional-port` | Coastal connector between Fujian and Zhejiang. |
| Ningbo | `major-port`, `Japan-route` | East China Sea trade, Japan/Ryukyu connections. |
| Hangzhou | `river-gateway`, `knowledge-port` | Grand Canal and Jiangnan wealth, silk, culture, scholars. |
| Nanjing | `river-gateway`, `capital-memory` | Major inland/river city, administration, scholarship, luxury goods. |
| Suzhou | `inland-hub`, `trade-hub` | Silk, crafts, literati, Jiangnan wealth. |
| Yangzhou | `river-gateway`, `trade-hub` | Canal commerce, salt, wealthy merchant world. |
| Tianjin / Dagu | `river-gateway`, `northern-gateway` | Access point toward Beijing and northern China. |
| Dengzhou | `regional-port`, `Korea-route` | Shandong maritime link to Korea and Liaodong. |
| Lushun | `supply-port`, `naval-anchorage` | Existing supply port; can become northern anchorage. |

### China Gameplay Identity

China should offer:

- High-value goods: silk, porcelain, tea, lacquerware, paper, books, medicine,
  salt, copper, crafted luxury goods.
- Knowledge rewards: maps, astronomical instruments, translated records,
  discovery hints, scholar contacts.
- State pressure: restricted access, tribute-route permissions, inspections,
  smuggling rumors, local officials.
- Merchant networks: Fujian traders, Canton brokers, Jiangnan merchants,
  Macao intermediaries.
- Story hooks: Enrico/Japan route, Ali trade diplomacy, Pietro artifact clues,
  Ernst cartography, Catalina rumors through Macao and Southeast Asia.

## Broader Asia Expansion

### Japan And Ryukyu

Current: Sakai, Nagasaki.

Candidates:

- Hakata: regional trade and Korea route.
- Hirado: early foreign contact and private maritime activity.
- Kagoshima: southern Japan and Ryukyu route.
- Naha / Shuri: Ryukyu kingdom, relay between China, Japan, and Southeast Asia.
- Kyoto / Osaka: inland or river-connected cultural/economic center.
- Ezo: existing supply port, can become northern exploration edge.

### Korea

Candidates:

- Busan: Japan route and southeastern gateway.
- Hanyang / Seoul: inland capital, reached through a gateway.
- Jeju: supply, storm, horse, and East China Sea route.
- Ulsan or Wonsan: regional port candidate if more density is needed.

### Taiwan And South China Sea

Candidates:

- Tainan / Tayouan area: anchorage or trade contact, not yet a later colonial
  city in this period.
- Penghu: island anchorage between Fujian and Taiwan.
- Manila / Maynila-Tondo: pre-Spanish regional trade node; later story state
  can evolve if the timeline advances.
- Cebu: Visayan route node.
- Jolo / Sulu: maritime network, pearls, piracy, regional diplomacy.
- Brunei: Borneo power and trade hub.

### Mainland Southeast Asia

Candidates:

- Ayutthaya: river-gateway capital and major trade court.
- Pegu / Bago: Lower Burma trade and political center.
- Martaban: Bay of Bengal and mainland Southeast Asia connector.
- Patani: Malay Peninsula trade and South China Sea route.
- Johor: post-Malacca Malay power and strait politics.
- Champa / Hoi An region: Vietnam coast and South China Sea trade.

### Island Southeast Asia

Current: Malacca, Ternate, Banda, Dili, Pasei, Sunda.

Candidates:

- Aceh: strong western Sumatra power and Indian Ocean gateway.
- Palembang: Sumatra river trade.
- Banten: western Java trade hub.
- Makassar: eastern Indonesia route and ship/trade identity.
- Ambon: spice route.
- Kupang / Timor anchorage: supply and sandalwood route.
- Bali: regional port, culture, and island route.

### South Asia

Current: Diu, Cochin, Ceylon, Goa, Calicut.

Candidates:

- Cambay / Khambhat: Gujarat trade and textile world.
- Surat: western India trade hub, especially useful if timeline extends later.
- Chaul: Konkan coast connector.
- Dabhol: Deccan coast trade.
- Mangalore: west coast regional port.
- Colombo / Kotte: Sri Lanka political/trade node, separate from generic
  Ceylon if needed.
- Nagapattinam: Coromandel coast and Bay of Bengal route.
- Pulicat: textile and coastal trade.
- Masulipatnam: Coromandel/Bay of Bengal trade hub.
- Chittagong: Bengal maritime gateway.
- Satgaon / Hooghly: Bengal river trade and inland access.

### Indian Ocean, Arabia, And East Africa

Current Arabia and East Africa already have several ports, but the Indian Ocean
network should become more coherent.

Candidates:

- Jeddah: Red Sea pilgrimage and trade gateway.
- Suez: Red Sea/Mediterranean connector.
- Mocha: coffee and Red Sea trade.
- Socotra: supply and hazard route.
- Qeshm or Bandar Abbas precursor node if Hormuz needs regional depth.
- Kilwa: Swahili coast trade identity.
- Zanzibar: East African trade node.
- Lamu: Swahili coast regional port.

## Global Balance

If the total target is 270-320 nodes, a rough distribution could be:

| Region | Current feel | Target direction |
| --- | --- | --- |
| Europe and Mediterranean | Dense | Add only selected missing hubs and inland connectors. |
| West and East Africa | Medium-sparse | Add coastal trade, Swahili, and supply density. |
| Arabia and Indian Ocean | Medium | Make routes and pilgrimage/trade identities clearer. |
| South Asia | Sparse for its importance | Add Gujarat, Bengal, Coromandel, and Sri Lanka depth. |
| China and East Asia | Too sparse | Major expansion priority. |
| Southeast Asia | Sparse but central | Major expansion priority. |
| Americas | Medium-sparse | Add indigenous and colonial-era nodes carefully by timeline. |
| Pacific | Very sparse | Add anchorages and discovery/supply nodes, not many full ports. |

## Implementation Path

### Phase 1: Governance Draft

- Create a candidate port catalog in governance docs.
- Give every candidate a stable canonical ID.
- Mark confidence and source references.
- Classify each candidate by port class and access type.

### Phase 2: Map Compatibility

- Add candidate map positions without changing gameplay.
- Check whether each candidate is reachable by current sea collision.
- Separate open-sea ports from river/inland locations.
- Decide which candidates need special connector logic.

### Phase 3: First Asia Slice

Implement a China and South China Sea data slice before trying to add all
global ports.

Suggested first slice:

- Guangzhou
- Fuzhou
- Ningbo
- Hangzhou
- Nanjing
- Yuegang
- Naha
- Hakata
- Busan
- Penghu
- Maynila-Tondo
- Brunei
- Patani
- Ayutthaya

This slice immediately makes East and Southeast Asia feel like a dense trade
world.

### Phase 4: Gameplay Promotion

Promote candidates into `src/data` only when at least one game system can use
them:

- Market goods.
- Port dossier UI.
- Route rumors.
- Discoveries.
- Story triggers.
- Shipyard availability.
- Supply and repair.

## Acceptance Criteria

- The expanded port list reaches at least 270 total map nodes in governance
  draft form before implementation.
- China has several major coastal/river/canal nodes and does not feel like a
  single endpoint.
- East Asia and Southeast Asia have meaningful local routes independent of
  Europe.
- Inland cities are represented honestly through access types.
- New ports have stable IDs, localization fields, source references, and map
  positions.
- Existing sailing and docking behavior remains stable until map logic is
  intentionally upgraded.

