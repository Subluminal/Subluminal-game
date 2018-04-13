package tech.subluminal.server.logic.game;

import static tech.subluminal.shared.util.function.FunctionalUtils.ifPresent;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import tech.subluminal.server.stores.records.Star;
import tech.subluminal.shared.stores.records.game.Coordinates;
import tech.subluminal.shared.stores.records.game.Fleet;
import tech.subluminal.shared.stores.records.game.Movable;
import tech.subluminal.shared.stores.records.game.Ship;

public class IntermediateGameState {

  private static final double DISTANCE_THRESHOLD = 0.00000001;

  private final double deltaTime;
  private final Map<String, List<Fleet>> destroyedFleets;
  private final Set<String> destroyedPlayers = new HashSet<>();
  private final Map<String, Map<String, Optional<Fleet>>> fleetsOnStars;
  private final Map<String, Map<String, Optional<Ship>>> motherShipsOnStars;
  private final Map<String, Map<String, Fleet>> fleetsUnderway;
  private final Map<String, Optional<Ship>> motherShipsUnderway;
  private final Map<String, Star> stars;
  private final PriorityQueue<PriorityRunnable> tasks = new PriorityQueue<>(
      Comparator.reverseOrder());

  public IntermediateGameState(double deltaTime, Map<String, Star> stars, Set<String> players) {
    this.deltaTime = deltaTime;
    this.stars = stars;

    fleetsOnStars = createMapWithKeys(stars.keySet(),
        () -> createMapWithKeys(players, Optional::empty));
    motherShipsOnStars = createMapWithKeys(stars.keySet(),
        () -> createMapWithKeys(players, Optional::empty));

    fleetsUnderway = createMapWithKeys(players, HashMap::new);

    destroyedFleets = createMapWithKeys(players, LinkedList::new);
    motherShipsUnderway = createMapWithKeys(players, Optional::empty);
  }

  public void advance() {
    stars.keySet().forEach(this::colonisationTick);

    stars.replaceAll((starID, star) ->
        star.advancedBy(deltaTime,
            time -> tasks.add(new PriorityRunnable(time, () -> generateShips(starID))),
            time -> tasks.add(new PriorityRunnable(time, () -> dematerializeTick(starID))))
    );

    fleetsUnderway.forEach((playerID, fleetMap) -> {
      fleetMap.keySet().forEach(fleetID -> moveFleet(0.0, playerID, fleetID, deltaTime));
    });
  }

  private void moveFleet(double start, String playerID, String fleetID, double deltaTimeLeft) {
    Fleet fleet = fleetsUnderway.get(playerID).get(fleetID);
    Star star = stars.get(fleet.getTargetIDs().get(0));

    double timeToArrive = fleet.getTimeToReach(star.getCoordinates());
    if (deltaTimeLeft > timeToArrive) {
      Fleet newFleet = new Fleet(
          fleet.getPositionMovingTowards(star.getCoordinates(), deltaTimeLeft),
          fleet.getNumberOfShips(), fleetID, fleet.getTargetIDs(), fleet.getSpeed());
      fleetsUnderway.get(playerID).put(fleetID, newFleet);
    } else {
      fleet.setCoordinates(
          new Coordinates(star.getCoordinates().getX(), star.getCoordinates().getY()));
      double newStart = start + timeToArrive;
      if (fleet.getTargetIDs().size() == 1) {
        tasks.add(new PriorityRunnable(newStart, () -> {
          fleetsUnderway.get(playerID).remove(fleetID);
          addFleetToStar(fleet, playerID, fleet.getTargetIDs().get(0));
        }));
      } else {
        fleet.getTargetIDs().remove(0);
        tasks.add(new PriorityRunnable(newStart,
            () -> moveFleet(newStart, playerID, fleetID, deltaTimeLeft - timeToArrive)));
      }
    }
  }

  private void colonisationTick(String starID) {
    // TODO: implement this
  }

  private void dematerializeTick(String starID) {
    // TODO: implement this
  }

  private void generateShips(String starID) {
    // TODO: implement this
  }

  public void addFleet(Fleet fleet, String playerID) {
    if (isOnStar(fleet)) {
      addFleetToStar(fleet, playerID, fleet.getTargetIDs().get(0));
    } else {
      setFleetUnderway(fleet, playerID);
    }
  }

  private void setFleetUnderway(Fleet fleet, String playerID) {
    fleetsUnderway.get(playerID).put(fleet.getID(), fleet);
  }

  public void addMotherShip(Ship ship, String playerID) {
    if (isOnStar(ship)) {
      addMotherShipToStar(ship, playerID);
    } else {
      setMotherShipUnderway(ship, playerID);
    }
  }

  private void setMotherShipUnderway(Ship ship, String playerID) {
    motherShipsUnderway.put(playerID, Optional.of(ship));
  }

  private void addMotherShipToStar(Ship ship, String playerID) {
    motherShipsOnStars.get(ship.getTargetIDs().get(0)).put(playerID, Optional.of(ship));
  }

  private boolean isOnStar(Movable movable) {
    return movable.getTargetIDs().size() == 1
        && movable.getDistanceFrom(stars.get(movable.getTargetIDs().get(0))) < DISTANCE_THRESHOLD;
  }

  private void addFleetToStar(Fleet fleet, String playerID, String starID) {
    Optional<Fleet> optionalFleet = fleetsOnStars.get(starID).get(playerID);
    ifPresent(optionalFleet,
        oldFleet -> {
          fleetsOnStars.get(starID)
              .put(playerID, Optional.of(oldFleet.expanded(fleet.getNumberOfShips())));
          destroyedFleets.get(playerID).add(fleet);
        },
        () -> {
          fleetsOnStars.get(starID)
              .put(playerID, Optional.of(fleet));
        }
    );
  }

  private static <E> Map<String, E> createMapWithKeys(Set<String> keys, Supplier<E> supplier) {
    return keys.stream().collect(Collectors.toMap(id -> id, id -> supplier.get()));
  }

  public Map<String, List<Fleet>> getDestroyedFleets() {
    return destroyedFleets;
  }

  public Set<String> getDestroyedPlayers() {
    return destroyedPlayers;
  }

  public Map<String, Map<String, Optional<Fleet>>> getFleetsOnStars() {
    return fleetsOnStars;
  }

  public Map<String, Map<String, Optional<Ship>>> getMotherShipsOnStars() {
    return motherShipsOnStars;
  }

  public Map<String, Map<String, Fleet>> getFleetsUnderway() {
    return fleetsUnderway;
  }

  public Map<String, Optional<Ship>> getMotherShipsUnderway() {
    return motherShipsUnderway;
  }

  public Map<String, Star> getStars() {
    return stars;
  }
}
