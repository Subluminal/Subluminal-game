package tech.subluminal.client.presentation.customElements;

import javafx.application.Platform;
import javafx.scene.Group;
import tech.subluminal.client.presentation.LobbyPresenter;
import tech.subluminal.client.presentation.controller.LobbyListController;
import tech.subluminal.client.presentation.controller.LobbyUserController;
import tech.subluminal.client.stores.LobbyStore;
import tech.subluminal.client.stores.UserStore;

public class LobbyComponent extends Group implements LobbyPresenter {

  private LobbyListComponent lobbyList;
  private LobbyUserComponent lobbyUser;
  private LobbyListController lobbyListController;
  private LobbyUserController lobbyUserController;
  private UserStore userStore;
  private LobbyStore lobbyStore;
  private LobbyPresenter.Delegate lobbyDelegate;

  public LobbyComponent() {

    lobbyUser = new LobbyUserComponent();
    lobbyList = new LobbyListComponent();
    lobbyListController = lobbyList.getController();
    lobbyUserController = lobbyUser.getController();


    this.lobbyList = lobbyList;
    this.lobbyUser = lobbyUser;

    this.getChildren().add(lobbyList);
  }

  public void setListActive() {
    lobbyDelegate.getLobbyList();
    Platform.runLater(() -> {
      this.getChildren().clear();
      this.getChildren().add(lobbyList);
    });
  }

  public void setUserActive() {
    Platform.runLater(() -> {
      this.getChildren().clear();
      this.getChildren().add(lobbyUser);
    });

  }

  public void onLobbyJoin(String id) {
    System.out.println("join lobby: " + id);
    lobbyDelegate.joinLobby(id);
  }

  public LobbyStore getLobbyStore() {
    return lobbyStore;
  }

  public void setUserStore(UserStore userStore) {
    this.userStore = userStore;

    lobbyUserController.setUserStore(userStore);
  }

  public void setLobbyStore(LobbyStore lobbyStore) {
    this.lobbyStore = lobbyStore;

    lobbyListController.setLobbyStore(lobbyStore);
    lobbyUserController.setLobbyStore(lobbyStore);
  }

  @Override
  public void joinLobbySucceded() {
    setUserActive();
  }

  @Override
  public void leaveLobbySucceded() {
    setListActive();
  }

  @Override
  public void createLobbySucceded() {

  }

  @Override
  public void lobbyListReceived() {

  }

  @Override
  public void lobbyUpdateReceived() {
    lobbyUserController.lobbyUpdateReceived();
  }

  @Override
  public void setLobbyDelegate(Delegate delegate) {
    this.lobbyDelegate = delegate;

    lobbyListController.setLobbyDelegate(delegate);
    lobbyUserController.setLobbyDelegate(delegate);
    setListActive();
  }
}