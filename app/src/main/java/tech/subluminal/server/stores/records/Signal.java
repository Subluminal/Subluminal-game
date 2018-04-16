package tech.subluminal.server.stores.records;

import java.util.List;
import tech.subluminal.shared.stores.records.game.Coordinates;
import tech.subluminal.shared.stores.records.game.GameObject;

/**
 * Represents a signal a player sent request a fleet to be sent from a star.
 */
public class Signal extends GameObject implements Comparable<Signal> {

  private final String starID;
  private final String playerID;
  private final long arrivalTime;
  private final int amount;
  private final List<String> targets;

  public Signal(Coordinates origin, String id, String starID, List<String> targets, String playerID,
      Coordinates starCoordinates, int amount, double lightSpeed) {
    super(origin, id);
    this.starID = starID;
    this.targets = targets;
    this.playerID = playerID;
    this.amount = amount;
    this.arrivalTime = (long) (origin.getDistanceFrom(starCoordinates)/lightSpeed);
  }

  /**
   * @param currentTime the time at which the status of the signal is evaluated.
   * @return the time since the signal has arrived
   */
  public long timeSinceArrival(long currentTime) {
    return currentTime - arrivalTime;
  }

  /**
   * @return the id of the star this signal is directed at.
   */
  public String getStarID() {
    return starID;
  }

  /**
   * @return a list containing all targets the fleet should fly over.
   */
  public List<String> getTargets() {
    return targets;
  }

  /**
   * @return the id of the player this signal was sent by.
   */
  public String getPlayerID() {
    return playerID;
  }

  /**
   * @return the maximum amount of ships that should be sent.
   */
  public int getAmount() {
    return amount;
  }

  /**
   * @return a value greater than 0 if this signal will arrive before the other.
   */
  @Override
  public int compareTo(Signal o) {
    return Long.compare(arrivalTime, o.arrivalTime);
  }
}
